-- Orders, their lines, stock holds and payment events.
--
-- Placing an order is one database transaction (place_order): it re-reads prices and stock
-- from the catalogue, takes the stock, and writes the order. Nothing the browser sends about
-- price is trusted. The stock is held for a limited time: 15 minutes for an online payment,
-- 24 hours for a cash-on-delivery order waiting for its email confirmation. A scheduled job
-- (pg_cron, every 5 minutes) gives the stock back when a hold runs out.
--
-- No public policies: orders are written and read by server code with the secret key.
-- A signed-in customer may read their own orders.

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,                               -- shown to the customer, e.g. HOK-1001
  access_token uuid not null default gen_random_uuid(),      -- lets a guest open their own order page
  clerk_user_id text references public.profiles (clerk_user_id) on delete set null,
  email citext not null,
  phone text not null,
  ship_to jsonb not null,                                    -- full_name, line1, line2, city, state, pincode, country
  payment_method text not null check (payment_method in ('online', 'cod')),
  status text not null check (status in (
    'pending_payment',         -- online: waiting for the payment to complete
    'awaiting_confirmation',   -- cash on delivery: waiting for the email confirmation
    'confirmed',               -- paid online, or COD confirmed: ready to pack
    'packed', 'shipped', 'delivered',
    'cancelled', 'expired', 'refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  subtotal_inr int not null check (subtotal_inr >= 0),
  shipping_inr int not null check (shipping_inr >= 0),
  total_inr int not null check (total_inr >= 0),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  cod_confirm_token uuid not null default gen_random_uuid(), -- the link in the COD confirmation email
  stock_held boolean not null default true,                  -- false once an expired/cancelled order gave its stock back
  hold_expires_at timestamptz,
  needs_attention text,                                      -- set when something needs the founder (e.g. paid after the hold ran out)
  placed_at timestamptz not null default now(),
  paid_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (clerk_user_id, placed_at desc);
create index orders_email_idx on public.orders (email);
create index orders_hold_idx on public.orders (hold_expires_at) where stock_held and hold_expires_at is not null;
create unique index orders_access_idx on public.orders (access_token);
create unique index orders_cod_token_idx on public.orders (cod_confirm_token);
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- What was bought, copied at the time of the order so later catalogue edits never change it.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_slug text not null,
  name text not null,
  size text not null,
  colour text,
  image text,
  unit_price_inr int not null check (unit_price_inr > 0),
  qty int not null check (qty between 1 and 10)
);
create index order_items_order_idx on public.order_items (order_id);

-- Every payment webhook, once. The primary key stops the same event being processed twice.
create table public.payment_events (
  event_id text primary key,
  type text not null,
  razorpay_order_id text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;

create policy "Own orders: read" on public.orders
  for select to authenticated using (clerk_user_id = (select public.clerk_user_id()));
create policy "Own order lines: read" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.clerk_user_id = (select public.clerk_user_id())));

-- ---------- place_order ----------
-- p: { clerk_user_id?, email, phone, ship_to{}, payment_method, items[{slug,size,qty}] }
-- Returns { ok:true, id, number, access_token, cod_confirm_token, subtotal_inr, shipping_inr, total_inr }
--      or { ok:false, error:'empty'|'unavailable'|'stock'|'cod_off'|'cod_limit', slug?, size?, available? }.
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_method text := p ->> 'payment_method';
  v_item record;
  v_row record;
  v_subtotal int := 0;
  v_shipping int;
  v_threshold int;
  v_fee int;
  v_cod_on boolean;
  v_cod_max int;
  v_order public.orders;
  v_lines jsonb := '[]'::jsonb;
begin
  if v_method not in ('online', 'cod') then
    raise exception 'Unknown payment method';
  end if;
  if jsonb_array_length(coalesce(p -> 'items', '[]'::jsonb)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'empty');
  end if;

  -- One line per variant, locked in a fixed order so two orders can never deadlock.
  for v_item in
    select i.slug, i.size, sum(i.qty)::int as qty
    from jsonb_to_recordset(p -> 'items') as i (slug text, size text, qty int)
    group by i.slug, i.size
    order by i.slug, i.size
  loop
    select v.id, v.stock, pr.slug, pr.name, pr.price_inr, pr.colour, pr.image
      into v_row
      from public.product_variants v
      join public.products pr on pr.id = v.product_id
      join public.categories c on c.slug = pr.category_slug
     where pr.slug = v_item.slug and v.size = v_item.size
       and pr.status = 'live' and c.launch_state = 'live'
     for update of v;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'unavailable', 'slug', v_item.slug, 'size', v_item.size);
    end if;
    if v_item.qty < 1 or v_item.qty > 10 or v_row.stock < v_item.qty then
      return jsonb_build_object('ok', false, 'error', 'stock', 'slug', v_item.slug, 'size', v_item.size, 'available', v_row.stock);
    end if;
    v_subtotal := v_subtotal + v_row.price_inr * v_item.qty;
    v_lines := v_lines || jsonb_build_object(
      'variant_id', v_row.id, 'product_slug', v_row.slug, 'name', v_row.name, 'size', v_item.size,
      'colour', v_row.colour, 'image', v_row.image, 'unit_price_inr', v_row.price_inr, 'qty', v_item.qty);
  end loop;

  select coalesce((select (value #>> '{}')::int from public.settings where key = 'free_shipping_threshold_inr'), 3500),
         coalesce((select (value #>> '{}')::int from public.settings where key = 'shipping_fee_inr'), 0),
         coalesce((select (value #>> '{}')::boolean from public.settings where key = 'cod_enabled'), true),
         coalesce((select (value #>> '{}')::int from public.settings where key = 'cod_max_order_inr'), 0)
    into v_threshold, v_fee, v_cod_on, v_cod_max;
  v_shipping := case when v_subtotal >= v_threshold then 0 else v_fee end;

  if v_method = 'cod' then
    if not v_cod_on then
      return jsonb_build_object('ok', false, 'error', 'cod_off');
    end if;
    if v_cod_max > 0 and v_subtotal + v_shipping > v_cod_max then
      return jsonb_build_object('ok', false, 'error', 'cod_limit', 'available', v_cod_max);
    end if;
  end if;

  insert into public.orders (number, clerk_user_id, email, phone, ship_to, payment_method, status,
                             subtotal_inr, shipping_inr, total_inr, hold_expires_at)
  values ('HOK-' || nextval('public.order_number_seq'),
          nullif(p ->> 'clerk_user_id', ''), p ->> 'email', p ->> 'phone', p -> 'ship_to', v_method,
          case when v_method = 'cod' then 'awaiting_confirmation' else 'pending_payment' end,
          v_subtotal, v_shipping, v_subtotal + v_shipping,
          now() + case when v_method = 'cod' then interval '24 hours' else interval '15 minutes' end)
  returning * into v_order;

  insert into public.order_items (order_id, variant_id, product_slug, name, size, colour, image, unit_price_inr, qty)
  select v_order.id, l.variant_id, l.product_slug, l.name, l.size, l.colour, l.image, l.unit_price_inr, l.qty
    from jsonb_to_recordset(v_lines) as l (variant_id uuid, product_slug text, name text, size text,
                                           colour text, image text, unit_price_inr int, qty int);

  update public.product_variants v set stock = v.stock - l.qty
    from jsonb_to_recordset(v_lines) as l (variant_id uuid, qty int)
   where v.id = l.variant_id;

  return jsonb_build_object('ok', true, 'id', v_order.id, 'number', v_order.number,
    'access_token', v_order.access_token, 'cod_confirm_token', v_order.cod_confirm_token,
    'subtotal_inr', v_order.subtotal_inr, 'shipping_inr', v_order.shipping_inr, 'total_inr', v_order.total_inr);
end $$;

-- Gives an order's stock back (used when a hold runs out or an order is cancelled).
create or replace function public.release_order_stock(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.product_variants v set stock = v.stock + i.qty
    from public.order_items i
   where i.order_id = p_order_id and v.id = i.variant_id;
  update public.orders set stock_held = false, hold_expires_at = null where id = p_order_id;
end $$;

-- Run by pg_cron: unpaid / unconfirmed orders whose hold has run out are expired.
create or replace function public.release_expired_orders() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  n int := 0;
begin
  for v_id in
    select id from public.orders
     where stock_held and hold_expires_at < now()
       and status in ('pending_payment', 'awaiting_confirmation')
     order by placed_at
     for update skip locked
  loop
    perform public.release_order_stock(v_id);
    update public.orders set status = 'expired' where id = v_id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- An online payment arrived (from the checkout's signature check or the Razorpay webhook).
-- Safe to call any number of times for the same order.
create or replace function public.mark_order_paid(p_razorpay_order_id text, p_payment_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_short text;
begin
  select * into v_order from public.orders where razorpay_order_id = p_razorpay_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_order.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true, 'number', v_order.number, 'access_token', v_order.access_token);
  end if;

  -- Paid after the hold ran out: take the stock again where it is still there, and flag the rest.
  if not v_order.stock_held then
    select string_agg(i.name || ' ' || i.size, ', ') into v_short
      from public.order_items i join public.product_variants v on v.id = i.variant_id
     where i.order_id = v_order.id and v.stock < i.qty;
    update public.product_variants v set stock = greatest(0, v.stock - i.qty)
      from public.order_items i where i.order_id = v_order.id and v.id = i.variant_id;
  end if;

  update public.orders
     set status = 'confirmed', payment_status = 'paid', paid_at = now(), confirmed_at = now(),
         razorpay_payment_id = p_payment_id, stock_held = true, hold_expires_at = null,
         needs_attention = case when v_short is not null
           then 'Paid after the stock hold ran out. Short of: ' || v_short else needs_attention end
   where id = v_order.id;
  return jsonb_build_object('ok', true, 'already', false, 'number', v_order.number, 'access_token', v_order.access_token);
end $$;

-- The customer followed the link in the cash-on-delivery email.
create or replace function public.confirm_cod_order(p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where cod_confirm_token = p_token and payment_method = 'cod' for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_order.status = 'awaiting_confirmation' then
    update public.orders set status = 'confirmed', confirmed_at = now(), hold_expires_at = null where id = v_order.id;
    return jsonb_build_object('ok', true, 'already', false, 'number', v_order.number, 'access_token', v_order.access_token);
  end if;
  if v_order.status in ('expired', 'cancelled') then
    return jsonb_build_object('ok', false, 'error', v_order.status, 'number', v_order.number);
  end if;
  return jsonb_build_object('ok', true, 'already', true, 'number', v_order.number, 'access_token', v_order.access_token);
end $$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
revoke all on function public.release_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.release_expired_orders() from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text) from public, anon, authenticated;
revoke all on function public.confirm_cod_order(uuid) from public, anon, authenticated;

-- ---------- The scheduled job ----------
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('release-expired-orders', '*/5 * * * *', $$select public.release_expired_orders()$$);
