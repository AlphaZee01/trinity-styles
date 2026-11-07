# Trinity Styles — Design & Motion Guidelines

Follow Emil Kowalski skills: emil-design-eng, animate, review-animations, find-animation-opportunities, mobile-native, apple-design, break-ui, pick-ui-library, ask-sonner.

Visual reference: `pics/Xk1f9.jpg`, `pics/wmtJg.jpg`, `pics/MKsBa.jpg`, `pics/Vlq81.jpg`.

## Visual direction

Mobile-first fashion shop. Soft blue light, frosted glass panels, and the crowned Trinity Styles logo. Dark mode uses the same glass on a deep navy field.

- Background: cool white in light mode, navy in dark mode
- Blue: logo, price, selected size, Try it on, active navigation
- A lower price override shows the base price crossed out beside the offer price
- Glass: translucent card, inner highlight, 18px blur
- Currency: GHS
- Theme: `next-themes`, class strategy, system preference, stored in `trinity-styles-theme`

## Motion tokens

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

- Press feedback 100–160ms, scale about 0.98, ease-out
- Try-on photos fade in with opacity
- Transform and opacity only
- UI motion under 300ms
- Respect `prefers-reduced-motion`
- Scrollbars are thin overlay pills. They appear while scrolling and fade when idle. Rows that hide a bar stay hidden.
- Toasts: Sonner

## Mobile

- Bottom navigation on the shop and admin
- A round cart button floats just above that bar when the bag has items
- Targets at least 44px
- Safe-area padding
- Inputs at least 16px
- Transparent tap highlight
- `touch-action: manipulation`
- Hover only under `(hover: hover) and (pointer: fine)`
- Use `dvh`, not `100vh`

## States

Every list and form needs a loading skeleton, an empty state, and an error state. Long names must wrap.
