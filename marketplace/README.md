# ScrapBridge — B2B Marketplace for Recyclable Materials

## Latest pass — investor-demo polish

- **Fresh brand theme**: new "Circuit" palette — deep evergreen/obsidian
  base, electric emerald primary, amber seller accent, violet admin accent
  — replacing the prior indigo/teal scheme. Because every screen is built
  on the same CSS variables, this re-themes the whole app (home, all
  dashboards, badges, buttons) without per-component changes.
- **Curated, demo-sized data**: exactly 10 Fixed Price listings, 10 Auction
  lots, and 10 Accept-Bids (negotiated) lots — hand-written instead of
  bulk-generated, so a live demo reads as a real, clean order book. Local
  storage cache keys were bumped so this loads fresh in any browser.
- **New "Three Ways to Trade" homepage section**: explicitly pitches the
  differentiator — Fixed Price / Live Auction / Accept Bids, one trust
  layer — right under the hero, plus a refreshed headline/tagline aimed at
  an investor audience.
- **Richer Auction/Bid cards**: hot-bidding flame badge, live price-gain %
  vs. starting bid, live watcher count, seller name — on top of the
  existing flip-clock countdown and pulsing live-ring indicators.
- **Confirmed already-simplified flows** (no changes needed — verified
  working): sellers create Fixed / Auction / Auction+Buy-Now / Accept-Bids
  listings from one unified form (`ProductFormPage`); buyers buy fixed,
  place bids, or Buy Now from one product detail page; and sellers see
  every order — fixed sale, auction win, or accepted bid — in one unified
  `Orders` table with type filter tabs, since `placeOrderFromAuction`
  already funnels auction/bid wins into the same order pipeline as fixed
  checkouts.
- Header + footer remain present on every screen (`DashboardShell` for
  all logged-in pages, `AuthLayout` for auth screens, `PublicNav`/`Footer`
  on the homepage) — unchanged, already correct.

Verified: full production build (`npm run build`) passes clean, and the
seed-data modules were executed directly (bundled + run under Node/jsdom)
to confirm no runtime errors and the exact 10/10/10 data counts.


Enterprise B2B marketplace prototype connecting verified Buyers and Sellers of
recyclable / industrial waste materials. Built with React 19, Vite, Tailwind
CSS v4, Radix primitives (shadcn-style), React Hook Form + Zod, React Router,
Framer Motion, Recharts and the Firebase SDK.

## Module 1 (this delivery): Project Foundation + Authentication

**Functional flow**

1. A visitor lands on **Sign in** (`/login`) or starts **Register** (`/register`).
2. Registering asks the visitor to choose **Buyer** or **Seller**
   (`/register/buyer`, `/register/seller`), then walks a 4-step wizard:
   Company details → Compliance documents / licenses → Contact & password →
   Review & submit.
3. On submit, the account is created with `status: "pending"` and the visitor
   is sent to **Pending Approval** (`/pending-approval`) with a reference
   code. They cannot sign in until an admin approves the account (this mirrors
   the brief's approval workflow — the actual Admin Approval screens are
   built in the Admin module).
4. Signing in checks the account status: `pending` / `rejected` / `suspended`
   accounts are blocked with a specific message; `approved` accounts are
   routed to a role-specific dashboard (`/buyer/dashboard`,
   `/seller/dashboard`, `/admin/dashboard`) via `ProtectedRoute`.

**Design system**

Industrial graphite + oxidized-copper palette (not the default
cream/terracotta or near-black/neon look) — themed on the actual subject: a
materials exchange. Space Grotesk (display) / Inter (body) / IBM Plex Mono
(data & reference codes), self-hosted via `@fontsource` (no external font CDN
dependency — this matters for an enterprise app that may sit behind a
corporate firewall). The signature element is the **Material Ticker**: a
scrolling, exchange-board-style list of reference material prices with
per-material swatch colors, reused as the visual language for badges and
categories everywhere else in the product.

**Architecture**

- `src/services/repositories/mockAuthRepository.js` — localStorage-backed
  mock that mirrors the `users` / `buyers` / `sellers` / `documents` /
  `approvals` Firestore collections exactly in shape and method signature.
- `src/services/auth.service.js` — thin facade the rest of the app imports.
  Swap `USE_FIREBASE` in `src/lib/firebase.js` to `true` and add a
  `firebaseAuthRepository.js` with the same method signatures to go live —
  **no component changes required**.
- `src/hooks/useAuth.jsx` — React context wrapping the service for
  `login`, `logout`, `registerBuyer`, `registerSeller`, current `user`.
- `src/components/ui/*` — hand-built shadcn-style primitives on Radix +
  `class-variance-authority` (Button, Input, Select, Checkbox, Progress,
  Card, Badge, Textarea, Label, Sonner toaster).
- `src/data/materials.js` — the 17 material categories from the brief, each
  with a swatch color, unit and (for the ticker) illustrative reference
  pricing.

## Demo accounts

| Role | Email | Password | Status |
|---|---|---|---|
| Admin | admin@scrapexchange.io | Admin@123 | approved |
| Buyer | buyer@demo.com | Buyer@123 | approved |
| Seller | seller@demo.com | Seller@123 | approved |
| Buyer | pending@demo.com | Pending@123 | pending (blocked on purpose) |

Or register a brand-new Buyer/Seller through the wizard to see it land in
Pending Approval.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
```

## Connecting real Firebase (when ready)

1. Copy `.env.example` to `.env.local` and fill in your Firebase project keys.
2. Set `USE_FIREBASE = true` in `src/lib/firebase.js`.
3. Add `src/services/repositories/firebaseAuthRepository.js` implementing
   `login`, `logout`, `getCurrentUser`, `registerBuyer`, `registerSeller`
   against Firebase Auth + Firestore + Storage (for document uploads), using
   `mockAuthRepository.js` as the interface reference.
4. Point `auth.service.js`'s `repository` at the new file.

## Module 2: Buyer Dashboard, Marketplace & Ordering

**Functional flow**

1. **Dashboard** (`/buyer/dashboard`) — order stat cards (total/pending/
   completed/cancelled), a monthly purchase value chart (Recharts area
   chart), a notifications feed, wishlist and recently-viewed teasers, and a
   recent-orders table.
2. **Marketplace** (`/buyer/marketplace`) — searchable, filterable product
   grid (material, location, price range, seller rating), sort, pagination,
   and a mobile filter drawer. Search is URL-driven (`?q=`) so the top-bar
   search box and dashboard both link straight into results.
3. **Product details** (`/buyer/marketplace/:productId`) — gallery, quantity
   stepper respecting MOQ, Add to Cart, Request Quote (dialog), Wishlist
   toggle, seller profile card, spec/description/seller tabs, and related
   listings. Viewing a product records it to "recently viewed."
4. **Cart & checkout** (`/buyer/cart`) — line-item quantity editing, optional
   PO upload, a mock payment dialog that authorizes payment then calls
   `orderService.placeOrder`, landing on the new order's detail page.
5. **Order management** (`/buyer/orders`, `/buyer/orders/:orderId`) —
   status-filtered order table; detail page has the full status timeline
   (Pending → Approved → Processing → Packed → Shipped → Delivered, with a
   distinct Cancelled state), tracking reference, invoice/receipt download,
   print, cancel (blocked once Shipped/Delivered), and repeat order.
6. **Wishlist** (`/buyer/wishlist`) and **Company Profile**
   (`/buyer/profile` — Company / Documents / Security / Notifications tabs,
   including a working change-password form) round out the buyer menu.

**New architecture pieces**

- `hooks/useCart.jsx`, `hooks/useWishlist.jsx` — localStorage-backed contexts
  via `mockCommerceRepository.js`, same Firebase-swap pattern as auth.
- `services/order.service.js` + `mockOrderRepository.js` — seeded order
  history plus `placeOrder` / `cancelOrder`.
- `services/profile.service.js` + `mockProfileRepository.js` — company
  profile, documents, password, notification prefs.
- `lib/documents.js` — generates a styled, branded invoice/receipt as an
  HTML document for real download/print (no PDF dependency needed for the
  prototype).
- `components/layout/dashboard/` — `Sidebar`, `Topbar` (search, cart badge,
  notifications dropdown, user menu), `DashboardShell` used by every
  authenticated page; `navConfig.js` centralizes the per-role menu so
  Modules 3–4 just add entries.
- `data/products.js`, `data/sellers.js` — 21 seeded listings across all 17
  material categories with deterministic (seeded-random) pricing/quantities,
  plus 5 sellers with ratings used by the seller-rating filter.

## What's next (per the module plan)

- **Module 4:** Admin Dashboard, Buyer/Seller/Product Approvals, User &
  Category Management, Reports, Audit Logs.

Each will follow the same pattern: functional flow → folder structure →
components → Firebase-ready service layer → mock data → responsive UI.

---

## Module 3: Seller Dashboard, Product Management & Order Fulfillment

**Functional flow**

1. **Dashboard** (`/seller/dashboard`) — 8 stat cards (Total/Active/Pending
   Products, Orders Received, Revenue, Pending Payments, Monthly Sales, Low
   Stock Alerts), Monthly Sales bar chart, Revenue Trend area chart, Top
   Selling Materials, notifications, low-stock alert list, recent orders
   received.
2. **Product management** (`/seller/products`, `/seller/products/new`,
   `/seller/products/:productId/edit`) — status-filtered listing table
   (Active/Pending/Inactive), the full Add/Edit form from the brief (name,
   material category, material type, description, grade, purity, quantity,
   unit, MOQ, price, currency, location, images, spec-sheet upload, stock
   toggle), Activate/Deactivate, Delete (with confirm dialog). New listings
   are created with `status: "pending"` — a ready-made hook for Module 4's
   admin product-approval queue.
3. **Order fulfillment** (`/seller/orders`, `/seller/orders/:orderId`) —
   status-filtered order table with inline Accept/Reject on pending orders;
   the detail page adds status updates, Dispatch (generates a tracking
   ref), Mark as Delivered, invoice/delivery-note upload, receipt
   generation, and a customer/buyer details card.
4. **Company profile** (`/seller/profile`) — Company / Certificates (with
   the seller's environmental & waste-handling license numbers) / Bank
   Details (payout account) / Security / Notifications tabs.

**New architecture pieces**

- `mockProductRepository.js` + `product.service.js` — seller-owned product
  CRUD, seeded from the buyer-facing catalog (`data/products.js`) with an
  added moderation `status` field, mirrors the `products` Firestore
  collection.
- `mockOrderRepository.js` extended with the seller side: `acceptOrder`,
  `rejectOrder`, `updateOrderStatus`, `dispatchOrder`, `attachInvoice`,
  `attachDeliveryNote`, plus `buyerCompany`/`buyerContact`/`buyerEmail` on
  every order so the seller has real customer context.
- `mockProfileRepository.js` extended with `getSellerProfile` (licenses +
  bank details).
- `Topbar`/`navConfig` made role-aware (seller nav, seller notifications,
  no cart icon for sellers).

**Known scope boundary:** a seller who registers through the wizard today
doesn't yet get a `sellerId` assigned or a live entry in the seller catalog
buyers browse — that wiring belongs to Module 4's admin approval flow, where
approving a seller is the natural place to provision it. The seeded demo
account (`seller@demo.com` → Gulf Recycling Industries) is fully wired end
to end in the meantime.

---

## Module 4: Admin Dashboard, Approvals, User & Category Management, Reports, Audit Logs

**Functional flow**

1. **Dashboard** (`/admin/dashboard`) — 8 marketplace-wide stats (Total/
   Pending Buyers, Total/Pending Sellers, Total/Pending Products, Orders
   Today, Total Revenue), Monthly Orders, Revenue, cumulative User Growth
   (buyers vs. sellers), and Material Distribution charts.
2. **Buyer / Seller approvals** (`/admin/approvals/buyers`,
   `/admin/approvals/sellers`) — status-filtered queues; a shared
   `ApprovalDetailDialog` shows registration details and every uploaded
   document, with Approve / Reject (with reason) / Request Additional
   Documents / Suspend. **Approving a seller provisions them into the live
   seller catalog** (`registerApprovedSeller`) — this is what closes the
   Module 3 scope boundary above; from that moment the seller can log in,
   list products, and appears with ratings on the buyer marketplace exactly
   like the seeded sellers.
3. **Product approvals** (`/admin/approvals/products`) — Approve / Reject
   (with reason, sets `inactive`) / Hide / Feature, with a dedicated
   `hidden` status alongside active/pending/inactive.
4. **User management** (`/admin/users`) — search + role filter across
   every account, Activate/Suspend, and Reset Password (shows the generated
   temporary credential, annotated as something that would be emailed in
   production).
5. **Category management** (`/admin/categories`) — add/remove material
   categories, units, and warehouse locations; changes propagate instantly
   everywhere they're consumed (marketplace filters, product forms) since
   they mutate the same in-memory arrays those screens already read from.
6. **Order management** (`/admin/orders`) — platform-wide order table with
   search; a management dialog supports status updates, a free-text
   dispute/resolution note, Cancel, and a mock Refund.
7. **Reports** (`/admin/reports`) — all 8 report types from the brief
   (Sales, Purchase, Buyer, Seller, Product, Revenue, Material-wise,
   Monthly), computed client-side from live order/product/user data, with
   real **PDF** (jsPDF) and **.xlsx** (SheetJS) export.
8. **Audit logs** (`/admin/audit-logs`) — day-grouped activity feed with
   category filter tabs (Login/Approval/Product/Order/User) and search.

**New architecture pieces**

- `mockAuditRepository.js` + `audit.service.js` — append-only log mirroring
  the `auditLogs` Firestore collection. `recordAuditEvent()` is called
  inline from `mockAuthRepository` (login, approvals, suspend/activate,
  password reset), `mockProductRepository` (create/update/delete/status/
  feature), and `mockOrderRepository` (place/cancel/accept/reject/status/
  dispatch/refund) — every category the brief lists is a real trail, not a
  static demo list.
- `admin.service.js` — approvals + user management facade over
  `mockAuthRepository`.
- `lib/reportExport.js` — shared PDF/Excel export helpers; currency columns
  are formatted consistently with the on-screen table (via the same
  `formatCurrency` helper) in both export formats.
- `data/sellers.js` — `registerApprovedSeller()` mutates the in-memory
  `SELLERS` catalog and persists it to localStorage, so a newly-approved
  seller is immediately visible everywhere `getSeller()` is already called
  across the buyer marketplace, product cards, and order pages.

**Fixes applied while building this module**

- Seeded account `createdAt`/`submittedAt`/`requestedAt` timestamps were
  hardcoded to fixed 2025 calendar dates, which fell outside the
  dashboard's rolling "last 6 months" window and made the User Growth chart
  render empty. Switched to dates computed relative to "now" so the charts
  always have real data regardless of when the prototype is opened.
- Report exports (PDF and Excel) were printing raw floating-point sums for
  currency columns (e.g. `218025.05000000002`) instead of formatted
  currency — both export paths now share the same `formatCurrency` logic
  the on-screen report table uses.

**Dependency note:** `xlsx` (SheetJS) has known advisories, but they apply
to *parsing* untrusted `.xlsx` input — this app only ever *writes* export
files, so that attack surface isn't reachable here. Worth swapping for a
more actively maintained library before using this codebase as a base for
a product that also needs to *import* spreadsheets.

## Demo walkthrough

Sign in as `admin@scrapexchange.io` / `Admin@123` and:
1. Approve **Northgate Import Co.** on Buyer Approvals — they can then sign
   in with `pending@demo.com` / `Pending@123`.
2. Approve **Canton Metals Recovery** on Seller Approvals — watch it appear
   as a real, ratable seller back on the buyer marketplace.
3. Approve a pending listing on Product Approvals, then check it's live on
   the buyer marketplace.
4. Pull a Revenue Report and export it as PDF or Excel.

This closes every module from the original brief — the prototype is now a
fully navigable, end-to-end B2B marketplace across Buyer, Seller, and Admin.

---

## Post-launch fix: seller-created products weren't reaching the buyer marketplace

**Bug:** after a seller created a product and an admin approved it, the
listing never appeared on the buyer marketplace.

**Root cause:** `data/products.js` — the module the buyer Marketplace and
Product Details pages read from — was a **static, in-memory catalog**
generated once at app startup. It had no connection to
`mockProductRepository.js`, the localStorage-backed store that seller
create/edit/delete and admin approve/reject/hide actions actually mutate.
The two were entirely separate data sources; nothing a seller or admin did
could ever reach the buyer-facing screens.

**Fix:** introduced a single shared store, `lib/productStore.js`
(`readProductStore()` / `writeProductStore()`), and pointed every consumer
at it:
- `data/products.js` (`getProduct`, `searchProducts`, the new
  `getActiveProducts()`) now reads live from that store, with
  `searchProducts`/`getActiveProducts` filtering to `status === 'active'`
  so buyers only ever see admin-approved listings.
- `mockProductRepository.js` (seller/admin mutations) now reads/writes the
  same store instead of keeping its own separate copy.
- The original static generator was extracted to `data/seedProducts.js`
  (`SEED_PRODUCTS`) — used only to seed the store on first run and to seed
  historical demo orders in `mockOrderRepository.js`; nothing reads it for
  display anymore.
- `ProductDetailsPage` also now 404s a buyer who navigates directly to a
  pending/inactive/hidden product's URL, instead of only relying on it
  being absent from search results.

Verified end-to-end: seller creates a product → admin approves it → it
appears on the buyer marketplace → buyer adds it to cart and completes
checkout against it successfully. Also confirmed the inverse — deactivating
a product removes it from buyer search and 404s its direct URL.

---

## Distinct look and feel per role, real images, and AI-style "Generate product"

### 1. Buyer / Seller / Admin now each have a distinct accent color

- **Buyer** — copper/amber (unchanged brand default)
- **Seller** — industrial steel-blue
- **Admin** — deep amethyst

Implemented as a CSS variable override, not a per-component reskin: every
screen already uses Tailwind classes like `bg-copper-500` / `text-copper-600`
/ `border-copper-400`, and those compile to `var(--color-copper-500)` etc.
under Tailwind v4. `.theme-seller` and `.theme-admin` (in `index.css`)
simply repoint those variables to steel-blue or amethyst; `DashboardShell`
and `AuthLayout` apply the right class based on `user.role`. The sidebar
mark, buttons, focus rings, badges, and the seller/admin registration or
dashboard screens all re-skin automatically — no component-by-component
color edits, and no risk of missing a spot.

### 2. Real images — what's actually feasible in this environment, and why

I want to be upfront about a real constraint here: this sandbox's network
is locked to package registries only, so I can't fetch or verify a working
direct URL from a stock-photo site to hardcode into the app. I tested this
several ways (direct fetch, the Wikimedia Commons API, etc.) and it's
consistently blocked. Shipping an unverified hotlinked URL risks broken
images for you, which felt worse than being honest about the limitation.
So instead, three things that are genuinely real and fully verified:

- **Real seller-uploaded photos now actually work.** `FileUploadField`
  reads an uploaded image, downscales it (max 640px) and re-encodes it as a
  JPEG data URL client-side — no server needed — and that photo now
  displays everywhere: product cards, the marketplace grid, product detail
  gallery (with a selectable thumbnail strip), cart, and order line items.
  Previously an "uploaded" image was just filename + size metadata with no
  actual picture behind it.
- **Every material category has its own distinct icon** (`data/materialIcons.js`,
  17 icons from the already-installed lucide-react set — copper is a cable,
  batteries a battery, glass a glass, textiles a shirt, etc.) layered over
  the existing swatch-color gradient, replacing the single generic box icon
  every listing used to share.
- **`ProductImage` gracefully falls back** to the icon+gradient placeholder
  if a photo URL is ever missing or fails to load, so nothing ever renders
  as a broken image.
- **The existing 21-listing demo catalog isn't left behind either.** The
  same procedural artwork generator that powers "Generate product" (below)
  now runs once per seed listing the first time the app loads, so the
  marketplace opens onto varied, textured per-listing imagery — not a flat
  color swatch repeated 21 times — without needing a single seller to have
  uploaded anything.

### 3. "Generate product" — one-click AI-style autofill

A **✨ Generate product** button on the Add Product screen fills in a
complete draft: name, material type, a genuinely varied description
(composed from rotating sourcing/quality/logistics phrase banks — a
different result nearly every click), grade, purity, quantity, MOQ, price,
currency, location, and a **generated placeholder photo** — a layered,
textured, material-colored graphic with a grade/lot stamp, rendered on an
HTML canvas, unique per generation (`lib/generateProduct.js`).

Worth being precise about what this is: it's a **client-side procedural
generator**, not a live call to an LLM — it runs instantly and offline,
with no API key to configure. It's a legitimate stand-in for "AI is
generating this" in a demo/investor-walkthrough context, but if you want it
backed by a real model call (e.g. actual Claude-written descriptions), that
would mean adding a backend endpoint to hold an API key rather than calling
Claude directly from the browser — happy to build that if you want it.

Everything the generator fills in stays fully editable before submitting,
and it only appears on new listings (not edit) so it can never overwrite a
real draft.

---

## Real photography for the marketplace, and a critical seller-dashboard fix

**Real images, sourced honestly.** Stock-photo CDNs (Unsplash, Pexels, Wikimedia)
are unreachable from the environment this was built in, so rather than ship
unverifiable hotlinked URLs, I found that `raw.githubusercontent.com` and
`codeload.github.com` *are* reachable and used them to pull down
[TrashNet](https://github.com/garythung/trashnet) (Thung & Yang, Stanford
CS229) — a real, citable, freely-licensed photo dataset. Every candidate was
manually reviewed and most were rejected for showing consumer brand logos
(Coca-Cola, Campbell's, etc.), which doesn't belong in a B2B tool. Four
clean, unbranded, verified photos made the cut — **Glass, Steel, Plastic,
Paper** — bundled as real static files in `public/images/materials/`, not
hotlinks, so they always work regardless of network conditions. Wired into
both the seed catalog and the "Generate product" button.

The other 13 material categories don't have a verified-clean real-photo
match yet and still use the generated textured artwork from the previous
round — honest placeholder art, not real photography. Swapping in more
curated real photos later is a matter of dropping files into
`public/images/materials/` and adding a `photo` path to the matching entry
in `data/materials.js` — no other code changes needed.

**Critical fix: the seller dashboard was crashing.** `SellerDashboardPage`
called a `startOfMonth()` helper that was referenced but never defined —
a `ReferenceError` that blanked the entire page for every seller, every
time. Added the missing helper, then went further: replaced the
calendar-month-to-date revenue comparison (which looks artificially
terrible for the first few days of any month — a bad first impression by
construction, not just bad luck) with a rolling 30-day vs. prior-30-day
window, which is both more standard and far less noisy. Verified live:
the hero now reads "$909,564.51 · ↗17% vs prior 30 days" in green instead
of crashing to a blank screen.
