-- Pepperr POS — run in Supabase SQL Editor (once per project)
-- Requires extension for gen_random_uuid()

create extension if not exists "pgcrypto";

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  price_lkr int not null check (price_lkr >= 0),
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create index if not exists products_category_idx on public.products (category_id);

-- Customers (phone / email optional)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_phone_idx on public.customers (phone) where phone is not null;
create index if not exists customers_email_idx on public.customers (email) where email is not null;

-- Sequential public order numbers (receipts, kitchen, search)
create sequence if not exists public.order_number_seq start with 1000 increment by 1 minvalue 1000;

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null default nextval('public.order_number_seq') unique,
  client_queue_id uuid,
  customer_id uuid references public.customers (id) on delete set null,
  order_type text not null check (order_type in ('dine_in', 'takeaway', 'delivery', 'scheduled')),
  scheduled_for timestamptz,
  status text not null default 'completed' check (status in ('open', 'completed', 'cancelled')),
  payment_method text not null check (payment_method in ('cash', 'card', 'credit')),
  subtotal_lkr int not null,
  total_lkr int not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_order_number_idx on public.orders (order_number desc);

create unique index if not exists orders_client_queue_id_uidx on public.orders (client_queue_id)
  where client_queue_id is not null;

alter sequence public.order_number_seq owned by public.orders.order_number;

-- Line items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_lkr int not null,
  quantity int not null check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Key-value settings (templates, branding, pin hash)
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- RLS: enabled with no policies = public (anon) access denied.
-- The Next.js server uses the Supabase service role key, which bypasses RLS.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;

-- Seed categories + products (idempotent-ish: delete products/categories if re-run needed)
-- Default POS PIN: pepperr  (bcrypt below) — change in Settings after login
insert into public.settings (key, value) values
  ('pos_pin_hash', '$2b$10$fAi0GnNN4AmgoVhX2LirjOG66P3Cg7dJRgFVIy32VBDkVJHRplp1u'),
  ('company_name', 'Pepperr'),
  ('company_address', 'Your address here'),
  ('company_phone', ''),
  ('logo_url', ''),
  ('bill_html_template', ''),
  ('email_bill_template', ''),
  ('sms_bill_template', ''),
  ('sms_ready_template', '')
on conflict (key) do nothing;

-- Seed menu (only if categories empty)
do $$
declare
  c_short uuid;
  c_rice uuid;
  c_fr uuid;
  c_bites uuid;
  c_set uuid;
  c_samba uuid;
  c_kottu uuid;
  c_lamp uuid;
  c_roti uuid;
  c_spec uuid;
  c_tea uuid;
begin
  if exists (select 1 from public.categories limit 1) then
    return;
  end if;

  insert into public.categories (name, sort_order) values
    ('Short Eats (Quick Bites)', 10),
    ('Rice & Curry', 20),
    ('Fried Rice', 30),
    ('Bites Menu (Starters)', 40),
    ('Set Menu (Individual)', 50),
    ('Samba Set Menu (Buddy Pack)', 60),
    ('Kottu', 70),
    ('Lamprise', 80),
    ('Roti', 90),
    ('Specialties', 100),
    ('Tea / Coffee', 110);

  select id into c_short from public.categories where name = 'Short Eats (Quick Bites)' limit 1;
  select id into c_rice from public.categories where name = 'Rice & Curry' limit 1;
  select id into c_fr from public.categories where name = 'Fried Rice' limit 1;
  select id into c_bites from public.categories where name = 'Bites Menu (Starters)' limit 1;
  select id into c_set from public.categories where name = 'Set Menu (Individual)' limit 1;
  select id into c_samba from public.categories where name = 'Samba Set Menu (Buddy Pack)' limit 1;
  select id into c_kottu from public.categories where name = 'Kottu' limit 1;
  select id into c_lamp from public.categories where name = 'Lamprise' limit 1;
  select id into c_roti from public.categories where name = 'Roti' limit 1;
  select id into c_spec from public.categories where name = 'Specialties' limit 1;
  select id into c_tea from public.categories where name = 'Tea / Coffee' limit 1;

  insert into public.products (category_id, name, price_lkr, sort_order) values
    (c_short, 'Veg Roll', 80, 1),
    (c_short, 'Veg Rotti', 80, 2),
    (c_short, 'Egg Roll', 100, 3),
    (c_short, 'Fish Roll', 100, 4),
    (c_short, 'Fish Rotti', 100, 5),
    (c_rice, 'Egg', 400, 1),
    (c_rice, 'Chicken', 500, 2),
    (c_rice, 'Fish', 650, 3),
    (c_rice, 'Pork', 500, 4),
    (c_fr, 'Egg Samba Rice', 700, 1),
    (c_fr, 'Egg Basmati Rice', 900, 2),
    (c_fr, 'Chicken Samba Rice', 900, 3),
    (c_fr, 'Chicken Basmati Rice', 1400, 4),
    (c_fr, 'Pork Samba Rice', 1300, 5),
    (c_fr, 'Seafood Basmati Rice', 1400, 6),
    (c_fr, 'Mix Fried Rice Samba', 1500, 7),
    (c_fr, 'Pork Basmati Rice', 1500, 8),
    (c_fr, 'Mix Fried Rice Basmati', 1700, 9),
    (c_bites, 'Omelette', 300, 1),
    (c_bites, 'Cheese Omelette', 500, 2),
    (c_bites, 'Chicken Wings (7)', 700, 3),
    (c_bites, 'Devil Chicken', 900, 4),
    (c_bites, 'Devil Pork', 1000, 5),
    (c_bites, 'Hot Butter Fish', 1100, 6),
    (c_bites, 'Hot Butter Chicken', 1300, 7),
    (c_bites, 'Hot Butter Cuttlefish', 1300, 8),
    (c_set, 'Samba Chicken Set', 600, 1),
    (c_set, 'Basmathi Chicken Set', 800, 2),
    (c_set, 'Devil Fish Basmati Set', 900, 3),
    (c_set, 'Devil Pork Basmati Set', 1000, 4),
    (c_set, 'Hot Butter Cuttlefish Set', 1000, 5),
    (c_samba, 'Chicken (Buddy)', 500, 1),
    (c_samba, 'Fish (Buddy)', 700, 2),
    (c_kottu, 'Egg Kottu', 800, 1),
    (c_kottu, 'Halmasso Kottu', 900, 2),
    (c_kottu, 'Chicken Kottu', 1000, 3),
    (c_kottu, 'Mix Kottu', 1100, 4),
    (c_kottu, 'Black Pork Kottu', 1200, 5),
    (c_kottu, 'Chicken & Cheese Kottu', 1600, 6),
    (c_lamp, 'Chicken', 800, 1),
    (c_lamp, 'Fish', 850, 2),
    (c_lamp, 'Pork', 900, 3),
    (c_roti, 'Parata', 60, 1),
    (c_roti, 'Godamba Roti', 60, 2),
    (c_roti, 'Egg Roti', 120, 3),
    (c_spec, 'Nasi Chicken', 1700, 1),
    (c_spec, 'Mongolian Chicken', 1800, 2),
    (c_tea, 'Ginger Plain Tea', 80, 1),
    (c_tea, 'Milk Tea', 160, 2),
    (c_tea, 'Black Coffee', 180, 3),
    (c_tea, 'Milk Coffee', 180, 4);
end $$;

-- Optional: branded placeholder thumbnails on product tiles (safe to re-run).
-- See: supabase/product-images.sql

-- If you created this database before sequential order numbers existed, run:
-- supabase/order-number-migration.sql

-- Offline POS idempotent sync column (nullable; partial unique index in schema above):
-- Existing DBs: supabase/offline-client-queue-migration.sql
