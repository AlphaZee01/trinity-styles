-- Store the RunPod charge and which public worker handled each try-on.

alter table public.try_on_sessions
  add column if not exists runpod_cost_usd numeric(12,6),
  add column if not exists runpod_endpoint_mode text;

alter table public.try_on_sessions
  drop constraint if exists try_on_sessions_endpoint_mode_check;

alter table public.try_on_sessions
  add constraint try_on_sessions_endpoint_mode_check
  check (
    runpod_endpoint_mode is null
    or runpod_endpoint_mode in ('qwen_image_edit', 'seedream_v4_edit')
  );

comment on column public.try_on_sessions.runpod_cost_usd is 'USD charge returned by RunPod as output.cost when the job finishes. Null for stubs and for jobs that finished before this was stored.';
comment on column public.try_on_sessions.runpod_endpoint_mode is 'Public worker used for this try-on: qwen_image_edit or seedream_v4_edit. Null when the endpoint has no listed per-image price.';
