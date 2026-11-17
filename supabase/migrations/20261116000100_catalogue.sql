-- Catalogue: categories, products, variants (size x colour) with stock, collections, lookbook,
-- curated lists and shop settings.
--
-- Access model: row-level security is ON for every table and there are NO policies for the
-- public keys, except reading `categories`. The storefront reads the catalogue on the server
-- (secret key, cached), so prices and stock can never be read or changed with the public key.

create extension if not exists citext;
create extension if not exists pg_trgm;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Categories (with the launch switch) ----------
create table public.categories (
  slug text primary key,
  name text not null,
  -- 'live' = on sale; 'coming_soon' = shown as a teaser only, nothing can be bought.
  launch_state text not null default 'live' check (launch_state in ('live', 'coming_soon')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------- Products ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  price_inr int not null check (price_inr > 0),          -- whole rupees
  category_slug text not null references public.categories (slug),
  card text not null default 'cutout' check (card in ('cutout', 'tile', 'photo')),
  tags text[] not null default '{}',
  is_new boolean not null default false,
  colour text not null,
  description text not null default '',
  details text[] not null default '{}',
  image text not null,                                     -- card image
  gallery jsonb not null default '[]',                     -- [{src, alt, fit}]
  colourways jsonb,                                        -- [{name, hex, gallery?}] or null
  -- draft = admin only; preview = founder sees it on the site; live = everyone.
  status text not null default 'draft' check (status in ('draft', 'preview', 'live')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_slug, sort_order);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Variants: one row per size (and colour) of a product, with its stock ----------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  colour text not null,
  size text not null,
  sku text not null unique,
  stock int not null default 0 check (stock >= 0),         -- units physically available
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  unique (product_id, colour, size)
);
create index product_variants_product_idx on public.product_variants (product_id, sort_order);
create trigger product_variants_updated before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ---------- Collections ----------
create table public.collections (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  eyebrow text not null,
  title text[] not null,
  hero jsonb not null,                                     -- {kind, src?, position?, positionMobile?}
  intro text not null default '',
  status text not null default 'live' check (status in ('draft', 'live')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
create trigger collections_updated before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_products (
  collection_slug text not null references public.collections (slug) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  position int not null default 0,
  primary key (collection_slug, product_id)
);

-- ---------- Lookbook ----------
create table public.looks (
  id text primary key,
  number text not null,
  title text[] not null,
  copy text not null default '',
  image text not null,
  width int not null,
  height int not null,
  alt text not null default '',
  span int not null default 6 check (span between 1 and 12),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
create trigger looks_updated before update on public.looks
  for each row execute function public.set_updated_at();

create table public.look_hotspots (
  id uuid primary key default gen_random_uuid(),
  look_id text not null references public.looks (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  x numeric(5, 2) not null check (x between 0 and 100),
  y numeric(5, 2) not null check (y between 0 and 100)
);
create index look_hotspots_look_idx on public.look_hotspots (look_id);

-- ---------- Curated lists: hand-picked product orders used by specific page sections ----------
create table public.curated_lists (
  key text primary key,                                    -- e.g. 'home.new_arrivals_mobile'
  product_slugs text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger curated_lists_updated before update on public.curated_lists
  for each row execute function public.set_updated_at();

-- ---------- Shop settings (edited from the admin area) ----------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- Row-level security ----------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.looks enable row level security;
alter table public.look_hotspots enable row level security;
alter table public.curated_lists enable row level security;
alter table public.settings enable row level security;

-- The only public read: category names and launch state (also used by the keep-alive ping).
create policy "Categories are public" on public.categories
  for select to anon, authenticated using (true);
