create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create unique index categories_name_lower_idx on public.categories (lower(name));

alter table public.categories enable row level security;

create policy categories_public_read on public.categories
for select using (true);

create policy categories_admin_insert on public.categories
for insert with check (private.is_admin());

create policy categories_admin_delete on public.categories
for delete using (private.is_admin());

create or replace function private.prevent_category_delete_in_use()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from public.products where category = old.name) then
    raise exception 'This category is still on a product.';
  end if;
  return old;
end;
$$;

create trigger categories_block_delete_in_use
before delete on public.categories
for each row execute function private.prevent_category_delete_in_use();

insert into public.categories (name)
values ('Tops'), ('Bottoms'), ('Dresses'), ('Outerwear'), ('Sets');
