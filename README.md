# Trinity Styles

Custom clothing storefront and CRM. Ghana market, GHS via Moolre Mobile Money, virtual try-on via RunPod, data on Supabase.

Always follow `/docs`. Do not invent extra product features.

## Stack

Next.js App Router, TypeScript, Tailwind, shadcn/ui, Zustand, Sonner, Supabase, Moolre, RunPod.

## Setup

```cmd
copy .env.example .env.local
npm install
npx skills@latest add emilkowalski/skills
npm run dev
```

Open http://localhost:3000. Without env keys the shop uses a seeded demo catalog (GHS). Try-on runs in stub mode. Checkout and live uploads need keys.

## Environment

See `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `MOOLRE_API_USER`, `MOOLRE_API_PUBKEY`, `MOOLRE_ACCOUNT_NUMBER`, `MOOLRE_WEBHOOK_SECRET`
- `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`
- `NEXT_PUBLIC_APP_URL`
- `TRY_ON_RATE_LIMIT_WINDOW_MS`, `TRY_ON_RATE_LIMIT_MAX`

Never put secret keys in `NEXT_PUBLIC_*`.

## Supabase

Local:

```cmd
npx supabase start
npx supabase db reset
```

Hosted:

```cmd
npx supabase link
npx supabase db push
npx supabase db query -f supabase/seed.sql
```

Promote an admin (do not self-assign from the client):

```sql
update public.profiles set role = 'admin' where id = '<user-uuid>';
```

The `sync_profile_role_to_app_metadata` trigger copies the role into `auth.users.raw_app_meta_data`.

## Moolre (GHS)

Point the callback URL to `https://YOUR_DOMAIN/api/moolre/webhook`. Set `MOOLRE_WEBHOOK_SECRET` to the secret Moolre sends in `data.secret`. Amounts are decimal cedis. Channels: `13` MTN, `6` Telecel, `7` AT.

## RunPod

The browser never calls RunPod. `/api/try-on` creates a session and the server polls `/api/try-on/[id]`. Admins configure **Qwen Image Edit** or **Seedream 4.0 Edit** at `/admin/settings/try-on` (DB settings) or via env:

- `RUNPOD_API_KEY` (fallback if not in DB)
- `RUNPOD_ENDPOINT_ID`, `RUNPOD_SUBMIT_JOB_URL`, `RUNPOD_CHECK_STATUS_URL` (optional)

If RunPod is not configured and stub mode is on, the API completes with the garment image for local dev.

## Render

- Build: `npm install && npm run build`
- Start: `node .next/standalone/server.js`
- Copy static assets as needed (`public` and `.next/static` into the standalone folder)
- Set env vars from `.env.example` and use the public URL for `NEXT_PUBLIC_APP_URL`

`next.config.ts` sets `output: "standalone"`.

## Routes

- Shop: `/`, `/products`, `/product/[slug]`, `/cart`, `/checkout`
- Account: `/account`, `/account/orders`, `/account/looks`, `/account/wishlist`
- Admin: `/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/settings/try-on`
