# Trinity Styles — API Contract

All secrets stay on the server. Amounts are GHS (decimal); Moolre collection uses cedis as a decimal string.

## GET /api/shop-settings

Auth: none. Public shop copy and delivery fee for checkout and product pages.

Response: `{ "shippingFeeGhs", "contactPhone", "contactWhatsapp", "contactEmail", "returnsPolicy", "deliveryNote", "sizeGuideNote" }`

## GET /api/admin/shop-settings

Auth: admin. Same fields plus `updatedAt`.

## PATCH /api/admin/shop-settings

Auth: admin. Updates singleton `shop_settings`. Amounts are GHS decimals.

## POST /api/moolre/initialize

Auth: required.

Request (new order):

```json
{
  "items": [{ "variantId": "uuid", "quantity": 1 }],
  "channel": "13",
  "momoPhone": "string",
  "shippingAddress": {
    "full_name": "string",
    "phone": "string",
    "momo_phone": "string",
    "city": "string",
    "region": "string",
    "address_line": "string",
    "notes": "string"
  }
}
```

`momoPhone` or `shippingAddress.momo_phone` is the Mobile Money wallet charged. When omitted, `shippingAddress.phone` is used.

`channel`: `13` MTN, `6` Telecel, `7` AT.

Request (OTP continuation):

```json
{
  "reference": "string",
  "channel": "13",
  "otp": "string"
}
```

Response:

- `{ "status": "otp_required", "reference", "orderId", "message" }`
- `{ "status": "payment_requested", "reference", "orderId", "message" }`

Creates pending order (first call), calls Moolre collection. Customer approves on phone.

## POST /api/moolre/webhook

Auth: Moolre callback `data.secret` must match `MOOLRE_WEBHOOK_SECRET`.

On success (`status` 1, `code` P01, `data.txstatus` 1): mark order paid if still pending, call `decrement_stock_for_order`, idempotent by `externalref`.

On payment failure (`txstatus` 2): cancel pending order if still pending.

## PATCH /api/admin/orders/[id]

Auth: admin. Body: `{ "status"?, "trackingNumber"? }`. Moving to `cancelled` from `paid|processing|shipped` restores stock once. Refund MoMo manually in the Moolre dashboard.

## GET /api/moolre/verify?reference=

Auth: required (order owner). Confirms payment via Moolre status if webhook lagged.

Response: `{ "status": "paid" | "pending" | "failed", "orderId": "uuid" }`

## GET /api/address?lat=&lng=

Auth: required.

Uses the signed-in customer's browser location, sent only after they tap Use my location, and returns the shipping fields that location can fill.

Query also accepts `accuracy` in metres. A fix within 60 metres can include the house number and GhanaPost code. A coarser fix returns the street, area, and a map pin, with `approximate: true`.

Response: `{ "city": "string", "region": "string", "address_line": "string", "approximate": boolean }`

## POST /api/analytics

Auth: none. Records one shop page view for the admin dashboard.

Request: `{ "path": "/products" }`

`path` is a shop path. Query strings are dropped. `/admin` and `/api` are rejected. The response sets an httpOnly visitor cookie and returns 204. The cookie is a random id, not the customer’s account.

## POST /api/try-on

Auth: optional (guests allowed).

Request: `{ "productId": "uuid", "personImagePath": "string", "garmentImageUrl": "string" }`

`garmentImageUrl` is optional. When it is sent, it must be one of that product's photos. Otherwise the try-on uses the first photo.

Rate limited by IP and user.

Response: `{ "sessionId": "uuid", "status": "processing", "pollIntervalMs": number, "maxPollAttempts": number }`

## GET /api/admin/try-on-settings

Auth: admin. Returns masked RunPod key, worker mode, URLs, timeouts, stub toggle, and preset URLs. Never returns the full API key.

## PATCH /api/admin/try-on-settings

Auth: admin. Updates singleton `try_on_settings`. Optional `applyPreset`: `qwen_image_edit` | `seedream_v4_edit`. `clearApiKey: true` removes the stored RunPod key. A new `runpodApiKey` replaces it. `runpodBalanceUsd` stores the typed credit balance. The full key is never returned.

## POST /api/admin/try-on-settings/test

Auth: admin. Server-side RunPod submit probe for the selected worker shape.

## GET /api/try-on/[id]

Auth: owner or guest with session id.

Response:

```json
{
  "id": "uuid",
  "status": "pending | processing | completed | failed",
  "resultImageUrl": "string | null",
  "error": "string (optional; present when status is failed after RunPod rejects the job)"
}
```

When a real job completes, the poll stores RunPod’s `output.cost` on the session. That amount is not included in this response.
