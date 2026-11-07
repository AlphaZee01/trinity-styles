# Trinity Styles — API Contract

All secrets stay on the server. Amounts are GHS; Paystack amounts are pesewas.

## POST /api/paystack/initialize

Auth: required.

Request:

```json
{
  "items": [{ "variantId": "uuid", "quantity": 1 }],
  "shippingAddress": {
    "full_name": "string",
    "phone": "string",
    "city": "string",
    "region": "string",
    "address_line": "string",
    "notes": "string"
  }
}
```

Response: `{ "authorizationUrl": "string", "reference": "string", "orderId": "uuid" }`

Creates pending order, calls Paystack initialize with currency GHS.

## POST /api/paystack/webhook

Auth: Paystack signature (`x-paystack-signature`).

On `charge.success`: mark order paid if still pending, decrement variant stock, idempotent by reference.

## GET /api/paystack/verify?reference=

Auth: required (order owner). Confirms transaction with Paystack if webhook lagged.

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
