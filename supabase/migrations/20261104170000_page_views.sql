create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  constraint page_views_path_length check (char_length(path) between 1 and 200)
);

create index page_views_created_at_idx on public.page_views (created_at desc);

alter table public.page_views enable row level security;

revoke all on table public.page_views from anon, authenticated;
