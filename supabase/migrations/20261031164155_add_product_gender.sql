alter table public.products
  add column gender text not null default 'unisex'
  check (gender in ('women', 'men', 'unisex'));
