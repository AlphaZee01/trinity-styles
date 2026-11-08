-- Shop settings singleton, order fulfilment fields, stock RPCs, try-on rate events.

create table public.shop_settings (
  id uuid primary key default '00000000-0000-4000-8000-000000000002'::uuid,
  shipping_fee_ghs numeric(12,2) not null default 25 check (shipping_fee_ghs >= 0),
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  returns_policy text not null default
    'You may return unworn items within 7 days of delivery. Contact us to arrange a pick-up or drop-off. Refunds are sent to your Mobile Money wallet after we receive the piece.',
  delivery_note text not null default
    'We deliver across Ghana. Accra and Tema usually arrive in 2–3 working days; other regions may take 5–7 working days.',
  size_guide_note text not null default
    'Sizes run true to the label. If you are between sizes, choose the larger size for an easy fit.',
  updated_at timestamptz not null default now(),
  constraint shop_settings_singleton check (id = '00000000-0000-4000-8000-000000000002'::uuid)
);

alter table public.shop_settings enable row level security;

insert into public.shop_settings (id) values ('00000000-0000-4000-8000-000000000002'::uuid)
on conflict (id) do nothing;

comment on table public.shop_settings is 'Singleton shop fees, contact, and policy copy; service role only.';

alter table public.orders
  add column if not exists shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  add column if not exists tracking_number text,
  add column if not exists stock_restored_at timestamptz;

create table public.try_on_rate_events (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null check (char_length(bucket_key) between 1 and 200),
  created_at timestamptz not null default now()
);

create index try_on_rate_events_bucket_created_idx on public.try_on_rate_events (bucket_key, created_at desc);

alter table public.try_on_rate_events enable row level security;

revoke all on table public.try_on_rate_events from anon, authenticated;

comment on table public.try_on_rate_events is 'Try-on rate limit events; service role inserts only.';

create or replace function private.decrement_stock_for_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  rows_affected int;
begin
  for r in
    select variant_id, quantity
    from order_items
    where order_id = p_order_id
  loop
    update product_variants
    set stock = stock - r.quantity
    where id = r.variant_id
      and stock >= r.quantity;
    get diagnostics rows_affected = row_count;
    if rows_affected <> 1 then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function private.restore_stock_for_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select variant_id, quantity
    from order_items
    where order_id = p_order_id
  loop
    update product_variants
    set stock = stock + r.quantity
    where id = r.variant_id;
  end loop;
  return true;
end;
$$;

create or replace function public.decrement_stock_for_order(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select private.decrement_stock_for_order(p_order_id);
$$;

create or replace function public.restore_stock_for_order(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select private.restore_stock_for_order(p_order_id);
$$;

revoke all on function public.decrement_stock_for_order(uuid) from public;
revoke all on function public.restore_stock_for_order(uuid) from public;
grant execute on function public.decrement_stock_for_order(uuid) to service_role;
grant execute on function public.restore_stock_for_order(uuid) to service_role;
