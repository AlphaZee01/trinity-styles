# Trinity Styles — Product Requirements Document

Always follow this document. Do not invent features outside this PRD.

## Product

Trinity Styles is a custom clothing e-commerce website and CRM. Customers browse clothing, virtually try on garments with AI, add items to cart, and pay with Paystack. Admins manage products, orders, customers, and try-on analytics.

Market: Ghana. Currency: GHS. Locale: en-GH.

## Constraints

- Fully custom (no Shopify, WooCommerce, or Medusa)
- Backend and database: Supabase (Postgres + Auth + Storage)
- Payments: Paystack
- Virtual try-on: RunPod Serverless API (backend only)
- Hosting: Render (Next.js)
- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui

## Users

- Guest shopper: browse, filter, try on, cart
- Customer (authenticated): checkout, orders, wishlist, saved looks, profile
- Admin: CRM dashboard at `/admin`

## Customer-facing features

- Mobile-first storefront
- Product listing with filters: category, size, color, price
- Product detail: gallery, size/color variants, stock
- Virtual try-on on product page (upload or camera, result, save look)
- Persistent shopping cart
- Checkout with shipping address
- Paystack: initialize → redirect → webhook → success page
- Account: order history, try-on history on My looks (finished sessions, saved or not), wishlist, profile
- Loading, empty, and error states with polished micro-interactions

## Admin / CRM (`/admin`)

- Role-based access (`profiles.role = admin` and `app_metadata.role`)
- Product CRUD with variants, images, stock
- Order management (view, update status)
- Customer list with profiles, orders, try-on history
- Try-on analytics: most tried products, try-on → purchase conversion
- Dashboard stats: revenue, orders, try-ons, top products

## Out of scope (v1)

- Google OAuth, Resend email, multi-currency, native apps, inventory reservation beyond decrement-on-paid

## Success criteria

- Guest can browse and try on without an account
- Authenticated customer can complete Paystack checkout in GHS
- Admin-only routes cannot be accessed by customers
- Secrets (Paystack, RunPod, service role) never reach the client
- RLS enabled on all public tables
