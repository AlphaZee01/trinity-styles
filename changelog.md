# Changelog

## 2026-11-08

- Stock adjustment functions can be called only with the service role. Anonymous and signed-in shoppers can no longer run them through the database API.
- Shop responses send frame, content-type, referrer, permissions, content-security, and HTTPS headers. The Moolre webhook secret is compared in constant time.
- Checkout, address lookup, and page-view recording are rate limited. Product and try-on uploads are capped at 8 MB. Try-on photos must be an upload or the signed-in customer's own storage path.
- Admin pages and product writes stay closed in production when Supabase is not configured. Auth return paths stay on this site.

- A finished virtual try-on shows a solid toast along the bottom with an animated winking face, a compliment, and an Add to bag button. The portrait frame stays reserved for the try-on photo, with a note to retry or change the picture when the model changes the wrong place.
- Try-on AI is no longer a tab on the admin phone bar. It stays in the desktop admin menu.
- Removing a piece from the bag shows a red toast with the piece name, size, and colour. Adding one stays green.
- Sign out asks for confirmation first. Cancel keeps the session. Confirm ends it. The bag stays on the device.
- Git author for this repo is AlphaZee01 with godwintudzi5@gmail.com so Vercel can match commits to the GitHub account.
- Secondary auth links no longer use `@apply` on custom classes, which was breaking the local CSS build.
- Status toasts sit in the horizontal center of the screen. The pill width no longer shifts them toward the right edge.

- Status toasts at the top center: pill banners with slide and bounce in, success, warning, error, and info colors in the spirit of [JDStatusBarNotification](https://calimarkus.github.io/JDStatusBarNotification/documentation/jdstatusbarnotification/). `lib/notify.ts` wraps Sonner with the same defaults.
- Buttons and shop CTAs use inset highlight, soft shadow, and a tighter press scale so they feel as tactile as the status toasts.
- Premium shop polish: soft ambient background, gentle page enter on route change, glass auth panels and checkout summary, refined inputs, bottom-nav active pill, richer bag and wishlist toasts, welcome toasts on sign-in, and image hover depth on product cards.

- Shop settings in admin: delivery fee in cedis, contact phone, WhatsApp, email, delivery note, returns policy, and size guide text.
- Checkout shows items, delivery, and total. Orders store shipping fee. MoMo wallet can differ from contact phone.
- Paying reduces stock only when every line is available. Cancelling a paid order puts stock back. Admin can save a tracking reference; customers see it when shipped.
- Failed MoMo payments cancel pending orders. Success and failure screens mention shop contact when set.
- Privacy, terms, and shipping-returns pages. Footer links and contact. Product page shows delivery from fee and honest size guide.
- Forgot-password and reset-password flow. Try-on asks for privacy consent. Try-on rate limits persist in the database. Live catalog no longer falls back to demo pieces when Supabase errors. Shop search box on the products page.

## 2026-11-07

- Checkout uses **Moolre** Mobile Money (MTN, Telecel, AT) instead of Paystack: `/api/moolre/initialize`, `webhook`, and `verify`; on-site MoMo network + OTP step; success page polls Moolre status. Paystack routes and `lib/paystack.ts` removed. Docs, env example, and AGENTS updated. `orders.paystack_reference` still stores the Moolre `externalref`.
- The product page photo uses the same portrait frame as the shop cards.
- Production is on Vercel at [https://trinity-styles.vercel.app](https://trinity-styles.vercel.app) (project **trinity-styles**). Supabase and rate-limit env vars are on the project; `NEXT_PUBLIC_APP_URL` points at the live URL. Vercel SSO deployment protection was turned off so the shop is public on the `.vercel.app` domain.
- Vercel CLI is a dev dependency with `vercel:login`, `vercel:link`, `vercel:deploy`, and `vercel:prod` scripts. `scripts/push-env-to-vercel.mjs` syncs `.env.local` to Vercel. `.vercelignore` skips local-only folders (`pics`, `load`).

## 2026-11-04

- The Try-on AI page leads with the remaining credit in cedis, with the dollar amount and how long it lasts underneath, and the rest of the page is grouped into spend, activity, and settings.
- The RunPod balance is saved with a Save button.
- Tried on most counts only finished real try-ons, so a failed run no longer takes a product’s place.
- The reports page states what try-ons, pieces tried, and bought after count, and each piece shows its tries beside how many customers also ordered it.
- A try-on photo on a customer’s page opens in a window that can be closed, instead of a new tab.
- A k6 run of one shopper, then fifty, against the production server is saved in load/reports. The warm-up is left out, and a page counts only when its real text comes back.
- The production build type-checks again. A new size can be saved without an id, and the account page passes the signed-in user id through.
- The shop records page views, and the admin dashboard shows today’s views, people, and the pages they opened.
- The homepage product list loads more pieces as you scroll and continues until the last one.
- An OpenFilm of the shop is in films/trinity-styles: the name, three pieces in cedis, virtual try-on, and paying in Ghana cedis. Open watch.html to play it.

## 2026-11-03

- The Try-on AI page shows RunPod spend from each finished job’s returned cost, with the published per-image rate ($0.02 for Qwen Image Edit, $0.027 for Seedream 4.0 Edit) when an older try-on has no stored cost, plus finished, failed, and preview counts.
- Try-on spend on that page is shown in Ghana cedis, using the Bank of Ghana mid rate of GH₵11.66 to the US dollar, with the dollar amount written under each figure.
- Try-on usage counts real RunPod jobs, and the spend is the public-endpoint bill on the RunPod account.
- Worker mode on the Try-on AI page opens and closes.
- The Try-on AI customer count is people, with signed-in runs and guest runs written underneath.
- The stored RunPod API key can be removed after two confirmations, the second warning that virtual try-on will not work without the key, and a new key can be pasted and saved.
- The Try-on AI page links to the RunPod billing page, and a typed balance shows how long the credit lasts at the recent daily spend.
- Adding a product starts with the photo upload, then the name.
- A price override below the base price shows the original amount crossed out, like a promotion, on the product, the card, and in the bag.
- Each order on the account orders page shows the photo of every piece in that order.
- The account orders page shows the date of each order.

## 2026-11-02

- Try-on prompts name the product category. Tops say top, Bottoms say trousers, and a category added later is named from that category.
- The shop header, footer, admin bar, and browser icon use the crowned Trinity Styles logo, with the name written beside the mark.
- The try-on sheet has a small full-picture control at the bottom right of the photo frame.
- Virtual try-on opens as a rounded, bordered modal over the product page, and the modal scrolls with a thin overlay bar that appears while you move.
- Every scrollbar in the shop and admin uses that same thin overlay: a rounded pill that shows while you scroll and fades when you stop. Chip rows that hide their bar stay hidden.
- The menu panel uses the same frosted rounded card as the footer, with the crowned mark, Trinity Styles, and Ghana.
- The place under the mark, and the shop copy that named the city, now says Ghana.
- The menu account section follows the footer: a signed-in customer sees Orders, Looks, their name, and Sign out.
- A round cart button floats at the bottom right, just above the bottom navigation, whenever the bag has items.
- The cart subtotal sits with the bag, under the products on a phone and beside them on a wide screen, instead of sticking over the list.
- The menu includes the header actions, search, theme, and cart, and the category list opens and closes.
- The account list in the menu opens and closes the same way.
- Product sizes and colours are no longer a fixed list. An admin can add another size or colour, and it stays available on later products.
- Try-on prompts tell the model to take only the product from a photo worn on a body, and to leave accessories and other clothes behind.

## 2026-11-01

- The try-on sheet matches the RunPod AI flow: garment preview before generate, generating state with spinner and rotating status copy, step hints, preview-only disclaimer, and close disabled while generating.
- Qwen Image Edit jobs now send `output_format`, `seed`, and `enable_safety_checker` so RunPod accepts the payload; failed jobs return a readable `error` to the try-on sheet.
- The try-on sheet uses a full-frame camera, generating, and result view, a timed progress bar, hold-to-compare, an inline error that keeps the photo, and Change photo without clearing the session.
- A saved shipping address on the account page starts collapsed, shows a one-line summary, and opens or closes when the heading is tapped. Saving also collapses it.
- My looks lists every finished try-on for the signed-in account, including ones that were not saved. The account Looks count matches that list.

## 2026-10-31

- Added product docs (`docs/PRD.md`, `TECH_SPEC.md`, `DESIGN.md`, `DATABASE.md`, `API.md`), `.env.example`, `AGENTS.md`, and Cursor follow-docs rule.
- Scaffolded Next.js App Router with Tailwind, shadcn/ui, Sonner, Zustand, and Supabase clients; installed Emil Kowalski skills.
- Added Supabase schema, RLS, storage buckets, profile/admin metadata triggers, and GHS seed catalog.
- Shipped storefront (catalog filters, PDP, cart, checkout, try-on stub, account) and Paystack initialize/webhook/verify.
- Added admin CRM for stats, products, orders, customers, try-on analytics, and image upload.
- Applied design tokens, loading/empty/error states, mobile nav, and Render setup notes.
- Enabled Turbopack CSS loading for production builds, deterministic GHS formatting, Paystack email from Auth, and cart hydration without mismatches.
- Restyled the shop and admin to the mobile mockups: cream and olive surfaces, Women/Men/New In, bottom navigation, rose try-on, and a product gender field.
- Rebuilt the product page to the phone mockup: shorter photo, rose size pill, Try it on, wishlist and shipping row, and a feature strip.
- Applied Emil Kowalski motion: press scale on controls, sheet and try-on entrances, staggered product cards, and top-centered Sonner toasts.
- Restyled the shop and admin with blue glass panels, a blue-and-white monogram, and a dark mode toggle that follows the system and saves the choice.
- Tightened the shop header into one bar with the monogram, collection tabs, search, and cart, and replaced the thin footer line with a glass brand block.
- Moved the logo to the left of the shop header and the menu to the right, and removed the GHS line from the footer.
- Moved Women, Men, and New In out of the header into the menu and the favorites filter, and gave the homepage a category row for the full catalog.
- Placed Add to bag directly under the size row and Try it on on the product page.
- Rebuilt the try-on sheet with photo and camera actions, a garment preview while the look prepares, and save and try-another buttons pinned at the bottom.
- Take photo now opens the device camera, with Capture saving the frame for the try-on.
- Kept the menu icon in the header and moved Back to a rounded button under the bar on inner pages.
- Search now opens a field in the header instead of a full-screen sheet, so the page stays usable.
- The menu opens as a right-hand panel over a dimmed page, with shop-for filters and a scrollable category list.
- Linked the shop to a new Supabase project and applied the schema, storage policies, and catalog seed. The admin check is created after the profiles table so the migration can run. Local keys live in `.env.local`.
- Put Create an account on the sign-in page, the menu, and the footer so a new customer can register.
- The footer shows Sign in and Create account for guests, and the customer’s name plus Sign out after they register or sign in.
- Rebuilt the account page with the profile, counts for orders, looks, and wishlist, recent orders, and saved pieces.
- Moved Back out of the sticky header so it sits on its own, rounded, at the left of the page.
- Replaced three catalog photos Unsplash no longer serves, so the trousers, polo, and blazer images load.
- Confirmation links and sign-in now start a session and load the account page, instead of leaving the shop looking signed out.
- Added skeleton screens for every shop and admin page so each route keeps its layout while data loads.
- Take photo now opens the front camera.
- Saving a piece fills the heart, changes the label to Saved, and gives the heart a short pop.
- The account page Sign out button is red.
- The shop header and bottom nav wait until the browser knows the page before showing Back or the active tab, so the first paint matches the server HTML.
- Wishlist and saved-look photos declare their display size, and the homepage hero image loads immediately.
- Add to bag stays on Added once that size is in the bag. Extra quantity is changed on the cart page.
- Checkout and the other link-styled buttons render as links, so the cart page no longer warns that Checkout is not a button.
- Clearing the cart quantity leaves the piece in the bag. The last count returns if the field is left empty.
- Checkout has one Use my location button that fills city, region, and address from the customer's position. Name and phone stay typed.
- The page, header, and bottom bar share one even background. The corner wash and the glass mix that dropped the blue tint are gone.
- Use my location waits for a closer fix and fills the house number, street, area, and GhanaPost code. A rough fix keeps the street and a map pin instead of a door that may be wrong.
- The account page can save a shipping address, and checkout opens with that address filled in.
- Saving that address also stores its phone number on the profile.
- The admin shell uses the shop monogram and glass rows, and Products is on the phone navigation with the other sections. The active tab is marked after the page is in the browser so the shell does not mismatch during hydration.
- Adding or editing a product uses grouped fields, photo previews, and labeled sizes. The shop link keeps following the name until it is edited by hand.
- The product form picks size and colour, hides the shop link and image links, and can add a category from the category menu. The admin dashboard links back to the account.
- The category menu stays in front of the panel below it.
- A category added in the product form is saved, and a category that is not one of the original five can be deleted when no product uses it.
- Any category can be deleted, and every deletion asks for confirmation first. A category still on a product stays.
- Uploaded product photos are resized before they are stored, and the photos already on Black Shirt were resized too, so the shop can load them.
- A product with several photos can be swiped through, and each photo has a thumbnail so the later uploads are on the page.
- Try-on lets you pick which product photo to use when a piece has more than one.
- After a try-on photo is chosen, Cancel clears it so another photo can be selected.
- Save look stores the finished try-on. The result id was dropped before the save, so the button did nothing.
- Admin try-on history shows the customer photo and the result. Private photos get a fresh link when the page opens.
- Customer, new product, and edit product pages have the shop’s Back button, which returns to that section’s list.
- The reports page ranks tried pieces, with totals, a share of the most-tried piece, and how many signed-in customers later bought it.
- The customer list shows orders, try-ons, and join date. A customer page shows what they spent, their shipping address, and orders with a status.
- The orders page shows what was bought, where it ships, and filters by status. Totals cover every order, the ones still to fulfil, and the paid amount.
- Virtual try-on uses RunPod Qwen Image Edit or Seedream 4.0 Edit from the server, with admin settings at `/admin/settings/try-on`, longer polling, and finished looks saved to the private `try-on-results` bucket.
