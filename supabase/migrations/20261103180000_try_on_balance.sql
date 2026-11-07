-- Admin-entered RunPod credit balance, used to estimate how long try-on spend lasts.

alter table public.try_on_settings
  add column if not exists runpod_balance_usd numeric(12,2);

comment on column public.try_on_settings.runpod_balance_usd is 'USD credit balance typed by an admin. Not read from RunPod.';
