-- Customers: profiles mirrored from Clerk, addresses, saved bag and wishlist, newsletter,
-- launch waitlist, consent log and contact messages.
--
-- The customer's identity is their Clerk user id (the `sub` claim of the Clerk session token,
-- which Supabase trusts through third-party auth). Policies let a signed-in customer reach
-- only their own rows. Forms that anyone can submit (newsletter, waitlist, contact) have no
-- public policies: they are written by server code after validation and rate limiting.

create or replace function public.clerk_user_id() returns text
language sql stable set search_path = '' as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

-- ---------- Profiles ----------
create table public.profiles (
  clerk_user_id text primary key,
  email citext,
  first_name text,
  last_name text,
  phone text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                                   -- set when the account is deleted (row anonymised)
);
create index profiles_email_idx on public.profiles (email);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Addresses ----------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  country text not null default 'IN' check (country = 'IN'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (clerk_user_id);
-- At most one default address per customer.
create unique index addresses_one_default_idx on public.addresses (clerk_user_id) where is_default;
create trigger addresses_updated before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------- Saved bag and wishlist ----------
create table public.bag_items (
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  qty int not null check (qty between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, variant_id)
);
create trigger bag_items_updated before update on public.bag_items
  for each row execute function public.set_updated_at();

create table public.wishlist_items (
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clerk_user_id, product_id)
);

-- ---------- Newsletter (double opt-in) ----------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  token uuid not null default gen_random_uuid(),           -- confirm / unsubscribe link
  source text not null default 'footer',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz
);
create unique index newsletter_token_idx on public.newsletter_subscribers (token);

-- ---------- Launch waitlist ("Notify me" for coming-soon categories) ----------
create table public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  category_slug text not null references public.categories (slug) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (email, category_slug)
);

-- ---------- Consent log (DPDP Act record: who agreed to what, when, where) ----------
create table public.consent_log (
  id bigint generated always as identity primary key,
  clerk_user_id text,
  email citext,
  kind text not null,                                      -- 'newsletter', 'waitlist', 'cookies_analytics', …
  granted boolean not null,
  source text not null,                                    -- which form or page
  created_at timestamptz not null default now()
);
create index consent_log_email_idx on public.consent_log (email);
create index consent_log_user_idx on public.consent_log (clerk_user_id);

-- ---------- Contact messages ----------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null,
  order_number text,
  message text not null check (char_length(message) <= 5000),
  status text not null default 'new' check (status in ('new', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

-- ---------- Rate limiting for public forms (no Redis needed) ----------
create table public.rate_limits (
  bucket text not null,                                    -- e.g. 'newsletter:<hashed ip>'
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (bucket, window_start)
);

-- Counts one hit and reports whether the caller is still within `max_hits` per window.
create or replace function public.rate_limit_hit(p_bucket text, p_window_seconds int, p_max_hits int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into public.rate_limits (bucket, window_start) values (p_bucket, w)
  on conflict (bucket, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into n;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return n <= p_max_hits;
end $$;
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;

-- ---------- Row-level security ----------
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.bag_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.launch_waitlist enable row level security;
alter table public.consent_log enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rate_limits enable row level security;

-- A signed-in customer can read and edit only their own rows.
create policy "Own profile: read" on public.profiles
  for select to authenticated using (clerk_user_id = (select public.clerk_user_id()));
create policy "Own profile: update" on public.profiles
  for update to authenticated using (clerk_user_id = (select public.clerk_user_id()))
  with check (clerk_user_id = (select public.clerk_user_id()));

create policy "Own addresses" on public.addresses
  for all to authenticated using (clerk_user_id = (select public.clerk_user_id()))
  with check (clerk_user_id = (select public.clerk_user_id()));

create policy "Own bag" on public.bag_items
  for all to authenticated using (clerk_user_id = (select public.clerk_user_id()))
  with check (clerk_user_id = (select public.clerk_user_id()));

create policy "Own wishlist" on public.wishlist_items
  for all to authenticated using (clerk_user_id = (select public.clerk_user_id()))
  with check (clerk_user_id = (select public.clerk_user_id()));
