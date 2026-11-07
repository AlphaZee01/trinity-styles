create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  );
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"customer"}'::jsonb
  where id = new.id;
  return new;
end;
$$;

create or replace function private.sync_profile_role_to_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    );
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(12, 2) not null check (base_price >= 0),
  category text not null,
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null,
  color text not null,
  sku text not null unique,
  stock integer not null default 0 check (stock >= 0),
  price_override numeric(12, 2) check (price_override is null or price_override >= 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  paystack_reference text not null unique,
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(12, 2) not null check (price_at_purchase >= 0)
);

create table public.try_on_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  product_id uuid not null references public.products (id),
  person_image_url text,
  result_image_url text,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  runpod_job_id text,
  created_at timestamptz not null default now()
);

create table public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  try_on_session_id uuid not null references public.try_on_sessions (id) on delete cascade,
  product_id uuid not null references public.products (id),
  created_at timestamptz not null default now()
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index products_category_idx on public.products (category);
create index product_variants_product_id_idx on public.product_variants (product_id);
create index orders_user_id_idx on public.orders (user_id);
create index try_on_sessions_user_id_idx on public.try_on_sessions (user_id);
create index try_on_sessions_product_id_idx on public.try_on_sessions (product_id);
create index wishlist_items_user_id_idx on public.wishlist_items (user_id);

create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create trigger on_profile_role_changed
after insert or update of role on public.profiles
for each row execute function private.sync_profile_role_to_app_metadata();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.try_on_sessions enable row level security;
alter table public.saved_looks enable row level security;
alter table public.wishlist_items enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
for select using (id = auth.uid() or private.is_admin());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

create policy "products_public_read" on public.products
for select using (is_active or private.is_admin());

create policy "products_admin_write" on public.products
for all using (private.is_admin()) with check (private.is_admin());

create policy "variants_public_read" on public.product_variants
for select using (
  private.is_admin()
  or exists (select 1 from public.products p where p.id = product_id and p.is_active)
);

create policy "variants_admin_write" on public.product_variants
for all using (private.is_admin()) with check (private.is_admin());

create policy "orders_select_own" on public.orders
for select using (user_id = auth.uid() or private.is_admin());

create policy "order_items_select_own" on public.order_items
for select using (
  private.is_admin()
  or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

create policy "orders_admin_update" on public.orders
for update using (private.is_admin()) with check (private.is_admin());

create policy "try_on_select_own" on public.try_on_sessions
for select using (user_id = auth.uid() or private.is_admin());

create policy "saved_looks_owner" on public.saved_looks
for all using (user_id = auth.uid() or private.is_admin())
with check (user_id = auth.uid() or private.is_admin());

create policy "wishlist_owner" on public.wishlist_items
for all using (user_id = auth.uid() or private.is_admin())
with check (user_id = auth.uid() or private.is_admin());

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('user-photos', 'user-photos', false),
  ('try-on-results', 'try-on-results', false)
on conflict (id) do nothing;

create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product_images_admin_write"
on storage.objects for insert
with check (bucket_id = 'product-images' and private.is_admin());

create policy "product_images_admin_update"
on storage.objects for update
using (bucket_id = 'product-images' and private.is_admin());

create policy "user_photos_owner_read"
on storage.objects for select
using (
  bucket_id = 'user-photos'
  and (private.is_admin() or split_part(name, '/', 1) = auth.uid()::text)
);

create policy "try_on_results_owner_read"
on storage.objects for select
using (
  bucket_id = 'try-on-results'
  and (private.is_admin() or split_part(name, '/', 1) = auth.uid()::text)
);
