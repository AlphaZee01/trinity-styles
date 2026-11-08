# Trinity Styles — Technical Specification

Do not invent architecture outside this spec.

## Stack

- Next.js App Router, TypeScript, Tailwind, shadcn/ui, Lucide, Zustand, Sonner
- Route Handlers + Server Actions
- Supabase Postgres, Auth, Storage (`@supabase/ssr`, `@supabase/supabase-js`)
- Moolre (API user, public key, account number, webhook secret — server only)
- RunPod Serverless (server API key)
- Vercel production deploy (`output: 'standalone'` for portable Node builds)

## Folder structure

```
app/(shop)/          storefront routes
app/admin/           admin CRM
app/api/try-on/      try-on POST + GET by id
app/api/moolre/      initialize, webhook, verify
lib/supabase/        browser, server, middleware, admin clients
lib/moolre.ts
lib/runpod.ts
lib/try-on-settings.ts
lib/types.ts
components/ui|product|cart|try-on|admin
hooks/
store/
supabase/migrations/
```

No `src/` directory.

## Auth

- Email/password via Supabase Auth
- Trigger creates `profiles` with `role = customer`
- Admin promotion is a privileged operation (service role / SQL), never client-writable
- Store admin flag in `auth.users.raw_app_meta_data.role` for JWT checks
- Middleware: `/account/*` requires session; `/admin/*` requires admin
- Never authorize from `user_metadata`

## Cart

Zustand with `persist` (localStorage). Snapshot: variantId, productId, name, slug, image, size, color, unitPrice (GHS), quantity.

## Payments (GHS)

1. Server creates `orders` (`pending`) + `order_items` with unique `paystack_reference` (stores Moolre `externalref`); `total_amount` includes `shop_settings.shipping_fee_ghs`
2. Moolre Mobile Money collection with `currency: GHS`, amount as decimal cedis, channel (MTN / Telecel / AT); payer phone may differ from delivery contact via `momo_phone`
3. Customer approves USSD prompt on phone; OTP step when Moolre requires it
4. Webhook validates callback `secret`; on `P01` + `txstatus` 1 call `decrement_stock_for_order` then mark paid (idempotent); on `txstatus` 2 cancel pending order
5. Success page polls `GET /api/moolre/verify` as backup and clears cart

## Try-on

1. Client uploads person image via `POST /api/try-on` (multipart) into private `user-photos`.
2. Server loads singleton `try_on_settings` (or env fallback), inserts `try_on_sessions`, and submits RunPod **Qwen Image Edit** or **Seedream 4.0 Edit** payloads (never the legacy `person_image`/`garment_image` shape). The prompt names the product category: Tops is a top, Bottoms is trousers, and any later category uses its own name. If the product photo shows the piece on a person, the prompt tells the model to take only that piece and leave accessories and other clothes behind.
3. Client polls `GET /api/try-on/[id]` using `pollIntervalMs` / `maxPollAttempts` from the POST response.
4. On complete, server copies the result into private `try-on-results` and stores a signed URL on the session.
5. Saving a look requires login (`POST /api/try-on/save`).
6. If RunPod is not configured and `use_stub_when_unconfigured` is true, stub completes with the garment image; admins configure keys at `/admin/settings/try-on`.

### RunPod input shapes

- **Qwen Image Edit** (`…/qwen-image-edit/run`): `input.image`, `prompt`, `negative_prompt`, `garment_image`, `output_format` (`jpeg` | `png`), `seed`, `enable_safety_checker`.
- **Seedream 4.0 Edit** (`…/seedream-v4-edit/run`): `input.images` [person, garment], `prompt`, `negative_prompt`, optional `product_details` / `product_metadata`.

### Future (not in scope)

Multi-garment try-on, Replicate/IDM-VTON, AI size recommendation, credits/vendor limits (see Uwear 2.0 reference).

## Security

- Service role only in server code
- No secret keys in `NEXT_PUBLIC_*`
- RLS on all public tables
- Moolre webhook callback secret verification
- Try-on rate limiting by IP and user id
