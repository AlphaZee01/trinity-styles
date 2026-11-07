create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create unique index sizes_name_lower_idx on public.sizes (lower(name));

alter table public.sizes enable row level security;

create policy sizes_public_read on public.sizes
for select using (true);

create policy sizes_admin_insert on public.sizes
for insert with check (private.is_admin());

create policy sizes_admin_delete on public.sizes
for delete using (private.is_admin());

create or replace function private.prevent_size_delete_in_use()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from public.product_variants where size = old.name) then
    raise exception 'This size is still on a product.';
  end if;
  return old;
end;
$$;

create trigger sizes_block_delete_in_use
before delete on public.sizes
for each row execute function private.prevent_size_delete_in_use();

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create unique index colors_name_lower_idx on public.colors (lower(name));

alter table public.colors enable row level security;

create policy colors_public_read on public.colors
for select using (true);

create policy colors_admin_insert on public.colors
for insert with check (private.is_admin());

create policy colors_admin_delete on public.colors
for delete using (private.is_admin());

create or replace function private.prevent_color_delete_in_use()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from public.product_variants where color = old.name) then
    raise exception 'This colour is still on a product.';
  end if;
  return old;
end;
$$;

create trigger colors_block_delete_in_use
before delete on public.colors
for each row execute function private.prevent_color_delete_in_use();

insert into public.sizes (name)
values ('S'), ('M'), ('L');

insert into public.colors (name)
values
  ('Black'),
  ('Charcoal'),
  ('Clay'),
  ('Ecru'),
  ('Forest'),
  ('Indigo'),
  ('Ivory'),
  ('Olive'),
  ('Sage'),
  ('Sand'),
  ('Stone');

insert into public.sizes (name)
select distinct variant.size
from public.product_variants as variant
where btrim(variant.size) <> ''
on conflict (name) do nothing;

insert into public.colors (name)
select distinct variant.color
from public.product_variants as variant
where btrim(variant.color) <> ''
on conflict (name) do nothing;
