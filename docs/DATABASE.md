# Trinity Styles — Database & RLS

Use Supabase CLI (`supabase migration new`) for new migrations. Do not invent extra tables beyond this document.

## Tables

### profiles (extends auth.users)

- id uuid PK → auth.users
- full_name text
- phone text — copied from the saved shipping address when the customer saves one
- avatar_url text
- shipping_address jsonb nullable — default checkout address (`full_name`, `phone`, `city`, `region`, `address_line`, `notes`)
- role text check (`customer` | `admin`) default `customer`
- created_at timestamptz

### categories

- id uuid PK
- name text unique
- created_at timestamptz
- The five shop categories are seeded. An admin can add more and can delete any category after confirming. A category that is still on a product cannot be deleted.

### sizes

- id uuid PK
- name text unique
- created_at timestamptz
- Seeded with S, M, and L, plus any size already on a variant. An admin can add more and can delete one after confirming. A size that is still on a variant cannot be deleted.

### colors

- id uuid PK
- name text unique
- created_at timestamptz
- Seeded with the shop palette, plus any colour already on a variant. An admin can add more and can delete one after confirming. A colour that is still on a variant cannot be deleted.

### products

- id uuid PK
- name, slug (unique), description, category text
- gender text check (`women` | `men` | `unisex`) default `unisex`
- base_price numeric(12,2)  -- GHS
- images text[]
- is_active boolean default true
- created_at, updated_at timestamptz

### product_variants

- id uuid PK
- product_id uuid FK products
- size, color, sku (unique) text
- stock integer default 0
- price_override numeric(12,2) nullable

### orders

- id uuid PK
- user_id uuid FK profiles
- status text: pending | paid | processing | shipped | delivered | cancelled
- total_amount numeric(12,2) — items + shipping_fee
- shipping_fee numeric(12,2) — flat delivery charge from shop_settings at checkout
- paystack_reference text unique (payment provider external reference, Moolre `externalref`)
- shipping_address jsonb — `full_name`, `phone`, `city`, `region`, `address_line`, `notes`, optional `momo_phone` for the MoMo wallet charged
- tracking_number text nullable — set by admin when shipped
- stock_restored_at timestamptz nullable — set when cancelled and stock was put back
- created_at timestamptz

### order_items

- id uuid PK
- order_id uuid FK orders
- variant_id uuid FK product_variants
- quantity integer
- price_at_purchase numeric(12,2)

### try_on_sessions

- id uuid PK
- user_id uuid nullable FK profiles
- product_id uuid FK products
- person_image_url, result_image_url text
- selected_garment_image_url text (optional; which product photo was used)
- status: pending | processing | completed | failed
- runpod_job_id text
- runpod_cost_usd numeric(12,6) nullable — USD `output.cost` from RunPod when the job finishes
- runpod_endpoint_mode text nullable — `qwen_image_edit` | `seedream_v4_edit` for the worker that ran the job
- created_at timestamptz

### shop_settings

Singleton row (`id` fixed). Delivery fee, customer contact, and policy copy. **No RLS policies** — only service-role admin APIs read or write.

- shipping_fee_ghs numeric(12,2)
- contact_phone, contact_whatsapp, contact_email text nullable
- returns_policy, delivery_note, size_guide_note text
- updated_at timestamptz

### try_on_settings

Singleton row (`id` fixed). RunPod Qwen Image Edit / Seedream 4.0 configuration. **No RLS policies** — only service-role admin APIs read or write.

- runpod_api_key, runpod_endpoint_mode (`qwen_image_edit` | `seedream_v4_edit` | `custom`)
- runpod_submit_job_url, runpod_check_status_url (`{jobId}` placeholder)
- runpod_endpoint_id (optional fallback)
- runpod_timeout_ms, runpod_max_retries, runpod_poll_interval_ms
- try_on_prompt, try_on_negative_prompt (optional overrides)
- use_stub_when_unconfigured boolean
- runpod_balance_usd numeric(12,2) nullable — credit balance an admin types, in US dollars
- updated_at timestamptz

### saved_looks

- id uuid PK
- user_id uuid FK profiles
- try_on_session_id uuid FK try_on_sessions
- product_id uuid FK products
- created_at timestamptz

### try_on_rate_events

- id uuid PK
- bucket_key text — rate-limit bucket (`user:{id}` or `ip:{address}`)
- created_at timestamptz
- Written only by the server. No client access.

### page_views

- id uuid PK
- path text — shop path only, no query string, never `/admin` or `/api`
- visitor_id uuid — random browser cookie, not a user id and not an address
- created_at timestamptz
- Written only by the server. No client read or write.

### wishlist_items

- id uuid PK
- user_id uuid FK profiles
- product_id uuid FK products
- unique (user_id, product_id)
- created_at timestamptz

## Indexes

products.slug unique, products.category, product_variants.product_id, orders.user_id, orders.paystack_reference unique, try_on_sessions.user_id, try_on_sessions.product_id, wishlist_items.user_id, page_views.created_at.

## RLS

- Enable RLS on all public tables
- categories, sizes, colors: public read; admin insert and delete
- products: public select where is_active; admin write
- product_variants: public select for active parent products; admin write
- profiles: select/update own row; cannot update role; admin select all
- orders / order_items: select own; writes via service role
- try_on_sessions: owner select; guest rows only via service role APIs
- try_on_settings: no client access; service role only
- shop_settings: no client access; service role only
- try_on_rate_events: no client access; service role only
- page_views: no client access; service role only
- saved_looks / wishlist_items: owner CRUD
- Admin checks: `exists (select 1 from profiles where id = auth.uid() and role = 'admin')`

## Storage

- product-images: public read, authenticated/admin upload
- user-photos: private, owner or service role
- try-on-results: private, signed URLs

## Triggers

- on auth.users insert → profiles row
- products.updated_at on update
- profiles.role changes should also update auth.users raw_app_meta_data (security definer, private schema)

## Stock RPCs (service role only)

- `decrement_stock_for_order(order_id)` — subtracts line quantities when payment is fulfilled; returns false if any variant is short
- `restore_stock_for_order(order_id)` — adds quantities back when a paid order is cancelled
