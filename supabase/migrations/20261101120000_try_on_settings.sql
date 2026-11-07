-- Admin-managed virtual try-on (RunPod Qwen / Seedream) settings — singleton row only.

create table public.try_on_settings (
  id uuid primary key default '00000000-0000-4000-8000-000000000001'::uuid,
  runpod_api_key text,
  runpod_endpoint_mode text not null default 'qwen_image_edit'
    check (runpod_endpoint_mode in ('qwen_image_edit', 'seedream_v4_edit', 'custom')),
  runpod_submit_job_url text default 'https://api.runpod.ai/v2/qwen-image-edit/run',
  runpod_check_status_url text default 'https://api.runpod.ai/v2/qwen-image-edit/status/{jobId}',
  runpod_endpoint_id text,
  runpod_timeout_ms integer not null default 30000 check (runpod_timeout_ms >= 5000),
  runpod_max_retries integer not null default 3 check (runpod_max_retries >= 1),
  runpod_poll_interval_ms integer not null default 2000 check (runpod_poll_interval_ms >= 500),
  try_on_prompt text,
  try_on_negative_prompt text,
  use_stub_when_unconfigured boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint try_on_settings_singleton check (id = '00000000-0000-4000-8000-000000000001'::uuid)
);

alter table public.try_on_settings enable row level security;

insert into public.try_on_settings (id) values ('00000000-0000-4000-8000-000000000001'::uuid)
on conflict (id) do nothing;

alter table public.try_on_sessions
  add column if not exists selected_garment_image_url text;

comment on table public.try_on_settings is 'Singleton RunPod try-on configuration; read/write via service role admin APIs only.';
comment on column public.try_on_sessions.selected_garment_image_url is 'Garment photo URL used for this try-on when the product has multiple images.';
