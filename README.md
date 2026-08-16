# FRANKY TECH

**Build. Manage. Grow.**

FRANKY TECH is an all-in-one business super-platform: invoicing, quotations,
receipts, payments, customers, inventory, expenses, reports, reviews,
referrals, subscriptions, customer portals, automation and analytics — for
freelancers and growing businesses.

This repository currently contains **Phase 1 — Foundation**:

- Node.js / Express backend skeleton
- PostgreSQL connection module (via `pg`)
- Baseline security middleware (Helmet, CORS, rate limiting)
- Centralized error handling
- A REST API foundation (`/api/health`, `/api/config/public`)
- A fully responsive, animated marketing landing page (vanilla HTML/CSS/JS)
- The FRANKY TECH logo, icon and animated intro sequence
- Social links and a working WhatsApp contact button

This repository now also includes **Phases 2–5**:

- **Phase 2 — Database**: SQL migrations for `users`, `sessions`,
  `password_resets`, `email_verifications`, `businesses`,
  `business_members`, `audit_logs`, plus a migration runner and a
  development seed script.
- **Phase 3 — Authentication**: register, login, logout, and session
  resolution (`/api/auth/*`), using HTTP-only cookies and scrypt password
  hashing (Node's built-in memory-hard KDF — no native build step required).
  Email verification and password reset endpoints exist as stable but
  not-yet-implemented (`501`) placeholders until email delivery is wired up.
- **Phase 4 — Business onboarding**: a 4-step onboarding wizard
  (`onboarding.html`) backed by `/api/businesses/*`, with strict
  ownership checks so a business can only ever be read or edited by
  its own members.
- **Phase 5 — Dashboard**: an authenticated dashboard shell
  (`dashboard.html`) with a business switcher, user menu, and stat cards
  wired to real business context. Numbers stay at zero with the correct
  shape until Invoices, Expenses, Inventory, Reviews and Referrals
  (their owning phases) populate them.

Payments, invoices, reviews, referrals, subscriptions and the admin
system are **not** part of Phases 1–5 — they arrive in later phases.

This repository now also includes **Phases 6–14** — the core commerce
engine:

- **Phase 6 — Customers**: full CRUD (`customers.html`), search, and a
  running balance computed live from outstanding invoices.
- **Phase 7 — Products & Services**: a unified `items` catalog
  (`products.html`) covering both, with type-specific fields (stock
  only applies to products). See the note at the top of
  `migrations/0002_commerce.sql` for why these share one table.
- **Phase 8 — Invoices**: a line-item builder (`invoice-new.html`) and
  detail view (`invoice-view.html`). All totals are recalculated
  server-side from catalog prices — the browser's numbers are only ever
  a preview (`server/services/finance.service.js`).
- **Phase 9 — PDFs**: `server/services/pdf.service.js` streams
  branded Invoice/Quotation/Receipt PDFs directly to the browser using
  `pdfkit` — nothing is written to disk.
- **Phase 10 — Quotations**: same builder pattern as invoices
  (`quotation-new.html`, `quotation-view.html`), with accept/reject
  status flow and one-click conversion into a real invoice.
- **Phase 11 — Receipts & Payments**: recording a payment on an
  invoice (`invoice-view.html`) atomically updates the invoice balance
  *and* generates a numbered receipt (`receipts.html`) in the same
  database transaction.
- **Phase 12 — Expenses**: categorized expense tracking
  (`expenses.html`) feeding directly into the Profit & Loss report.
- **Phase 13 — Inventory**: stock is decremented automatically when a
  product is invoiced, with a manual adjustment tool and a low-stock
  banner on `products.html` (`inventory_transactions` logs every
  movement).
- **Phase 14 — Reports**: `reports.html` — Profit & Loss, sales by
  day, top products, expense breakdown, and invoice status — every
  number is a direct database aggregate.

Reviews, customer portal, referrals, subscriptions, a live payment
gateway, notifications, automation, team roles, support tickets and
the admin dashboard are **not** part of Phases 1–14 — they arrive in
later phases. "Online" payments are currently accepted as a manually
confirmed method, same as cash — real gateway webhook verification is
Phase 19.

This repository now also includes **Phases 15–23**:

- **Phase 15 — Reviews**: request a review from a customer
  (`reviews.html` → generates a link), public submission with no login
  required (`review-submit.html`), moderation (approve/hide), and
  business responses. A review tied to a **paid** invoice is
  automatically marked Verified.
- **Phase 16 — Customer Portal**: rather than a second login system
  for customers, invoices/quotations/receipts get a secure, revocable,
  token-based share link (`portal.html`) — see the design note at the
  top of `migrations/0003_growth.sql`.
- **Phase 17 — Referral System**: every user already had a referral
  code (Phase 3); this phase adds click tracking, signup attribution,
  qualification (on first business created), and a referral dashboard
  (`referrals.html`). Self-referral is blocked at the database level.
- **Phase 18 — Subscriptions**: four database-driven plans
  (`subscription_plans` table, seeded in `migrations/0004_plans.sql`),
  a plan/usage page (`subscription.html`). No live billing yet —
  "upgrading" assigns the plan directly, which is Phase 19's job to
  connect to a real charge.
- **Phase 19 — Payment Gateway Architecture**: `POST
  /api/public/webhooks/payment` — every inbound call is logged before
  being trusted, and a payment is only ever treated as confirmed after
  HMAC signature verification against `PAYMENT_WEBHOOK_SECRET`
  succeeds. No real gateway (Stripe, Flutterwave, etc.) is connected —
  that needs your own merchant credentials — but the shape is built so
  wiring one in later is a config change, not a rewrite.
- **Phase 20 — Notifications**: a bell icon in the top bar on every
  authenticated page, backed by `notifications.html`-less dropdown UI
  (built into `app-shell.js`) — payment received, review received,
  overdue invoices, and low stock all raise one.
- **Phase 21 — Automation Engine**: `server/services/automation.service.js`
  is the one place these triggers live — overdue invoices and low
  stock are checked fresh (deduped for 24h) on every dashboard load;
  payment-received and review-received fire at the moment they happen.
- **Phase 22 — Team Management**: invite by email with a role
  (`team.html`), instant attach if the person already has an account,
  role changes and removal — the owner's role can never be changed or
  removed.
- **Phase 23 — Support**: in-app ticket creation and threaded replies
  (`support.html`), scoped per business.

This repository now also includes **Phases 24–30 — the final stretch**:

- **Phase 24 — Admin Dashboard**: a completely separate `/admin/*`
  section, gated by `is_platform_admin` (a flag on the `users` table,
  never set automatically — see `migrations/0006_make_admin.sql` for
  how to grant the first one). Platform-wide stats, user
  suspend/reactivate, flagged-review moderation, feedback triage,
  live-editable subscription plans, announcements, and an audit log
  viewer.
- **Phase 25 — Security Hardening**:
  - **Audit logging** — the `audit_logs` table (created in migration
    0001 but unused until now) is written to on login, logout, failed
    login, registration, invoice create/cancel, payment recording,
    subscription changes, review moderation, and admin actions.
  - **CSRF protection** — a double-submit cookie pattern
    (`server/utils/csrf.js`): login/register issue a readable CSRF
    cookie, and every state-changing request must echo it back as an
    `X-CSRF-Token` header or get rejected.
  - **XSS hardening** — every page that renders user-supplied text
    (customer names, review comments, support messages, registration
    names, feedback) via `innerHTML` now escapes it first
    (`FrankyAuth.escapeHtml` / a local equivalent on public pages).
    This was a real gap found and fixed this phase, not a pre-existing
    guarantee — see the file-by-file list in git history if you want
    to audit it yourself.
  - Additional targeted rate limiting for public write endpoints
    (review submission, referral click tracking).
- **Phase 26 — Testing**: `tests/*.test.js`, using Node's built-in
  test runner (`node --test`) — zero extra dependency needed. Covers
  the financial calculation engine (the module every invoice,
  quotation and report depends on), password hashing, slug
  generation, and input validators. Run with `npm test`.
- **Phase 27 — Performance**: gzip/brotli response compression
  (`compression` middleware) on top of the pagination and 44+ database
  indexes already built into earlier migrations, plus static-asset
  cache headers already in place since Phase 1.
- **Phase 28 — SEO**: `robots.txt` and `sitemap.xml`, JSON-LD
  structured data on the landing page (loaded from an **external**
  file, `data/organization.jsonld`, to keep a strict zero-inline-script
  policy), and `noindex` on every authenticated/admin page.
- **Phase 29 — PWA**: `manifest.json`, a full icon set, and a service
  worker (`sw.js`) that caches the static app shell for fast repeat
  loads — but **never** caches anything under `/api/`. Financial data
  always reflects the real server state or fails honestly when
  offline; it's never served stale.
- **Phase 30 — Production Deployment**: `DEPLOYMENT.md` covers hosting
  options, the environment checklist, HTTPS/cookie implications,
  granting the first admin, and `scripts/backup.sh` /
  `scripts/restore.sh` for database backup/restore with retention.

The FRANKY TECH icon and branding assets were replaced mid-project
with a network/node-style logo — see `client/assets/logo/` for the
full generated set (icon, favicons, Apple touch icon, PWA icons, and
an Open Graph social preview image).

---

## 1. Requirements

- Node.js 18 or later
- npm
- PostgreSQL 14+ (optional for Phase 1 — the site runs without it, but
  `/api/health` will report the database as disconnected)

## 2. Installation

```bash
git clone <your-repo-url> franky-tech
cd franky-tech
npm install
```

## 3. Environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Port the server listens on (default `3000`) |
| `APP_URL` | Public URL of the app (used for CORS) |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Used from Phase 3 (authentication) onward |
| `EMAIL_*` | Used from Phase 3 onward for verification/reset emails |
| `PAYMENT_*` | Used from Phase 19 onward for payment gateway integration |
| `STORAGE_*` | Used from later phases for logo/receipt file storage |
| `WHATSAPP_NUMBER`, `FACEBOOK_URL`, `TIKTOK_URL`, `INSTAGRAM_URL`, `YOUTUBE_URL` | Public contact/social links rendered on the site |

Never commit your real `.env` file — it is already excluded in `.gitignore`.

## 4. Database setup

Create a local PostgreSQL database:

```bash
createdb franky_tech
```

Point `DATABASE_URL` in `.env` at it, for example:

```
DATABASE_URL=postgresql://franky_user:franky_password@localhost:5432/franky_tech
```

Then run the migrations:

```bash
npm run migrate
```

This creates `users`, `sessions`, `password_resets`, `email_verifications`,
`businesses`, `business_members`, `audit_logs` (migration 0001);
`customers`, `items`, `inventory_transactions`, `document_sequences`,
`invoices`, `invoice_items`, `quotations`, `quotation_items`, `payments`,
`receipts`, `expenses` (migration 0002); `reviews`, `review_requests`,
`review_reports`, `document_shares`, `referral_clicks`,
`referral_rewards`, `subscription_plans`, `subscriptions`,
`payment_webhook_events`, `notifications`, `team_invitations`,
`support_tickets`, `support_messages` (migration 0003); the four
default subscription plans (migration 0004); the `is_platform_admin`
flag, `platform_feedback`, `platform_announcements` (migration 0005);
and a no-op reminder migration (0006) with instructions for manually
granting your first platform admin. Migrations are tracked
in a `schema_migrations` table, so `npm run migrate` is always safe to
re-run — it only applies files it hasn't applied before.

Optionally, seed one demo account (development only — this refuses to run
if `NODE_ENV=production`):

```bash
npm run seed
```

This creates:

```
email:    demo@frankytech.test
password: DemoPass123!
```

with a demo business already onboarded, so you can log in at
`/login.html` and land straight on a populated dashboard.

## 5. Running the app

```bash
# development (auto-restarts on file changes)
npm run dev

# production
npm start
```

Then open **http://localhost:3000** in your browser.

## 6. Testing it works

1. Visit `http://localhost:3000` — you should see the animated FRANKY TECH
   logo intro, then the landing page.
2. Visit `http://localhost:3000/api/health` — you should see a JSON response
   confirming the API is running and whether the database is connected.
3. Resize the browser or open on a phone — the layout, navigation and
   WhatsApp button should all remain usable.
4. Toggle dark mode using the icon in the top navigation.
5. Click the floating WhatsApp button — it should open a pre-filled chat.
6. Click **Get Started** → fill in the registration form → you should land
   on the onboarding wizard (`onboarding.html`).
7. Complete all 4 onboarding steps → you should land on `dashboard.html`
   with your business name showing in the top-left switcher.
8. Click your business name to see the switcher menu; click **Log out**,
   then log back in at `/login.html` — you should return to the same
   dashboard state.
9. Try visiting `/dashboard.html` directly while logged out — you should
   be redirected to `/login.html` (the page checks `/api/auth/me` first).
10. If you ran `npm run seed`, log in with `demo@frankytech.test` /
    `DemoPass123!` and confirm the dashboard loads immediately (no
    onboarding wizard, since the demo business is pre-onboarded).
11. On the dashboard, click **Customers** → add one. Then **Products**
    → add a product with some stock. Then **Invoices** → **New invoice**
    → pick the customer, add the product as a line, save.
12. On the invoice page, click **View / Download PDF** — a branded PDF
    should open in a new tab. Click **Record payment** for the full
    balance — the status should flip to **Paid** and a receipt should
    appear under **Receipts**.
13. Go back to **Products** — the stock you invoiced should have been
    automatically decremented.
14. Try **Quotations** → **New quotation** → save → **Mark accepted** →
    **Convert to invoice** — a new invoice should be created from it.
15. Add an entry under **Expenses**, then open **Reports** — Profit &
    Loss, the sales chart and the expense breakdown should reflect what
    you just entered.
16. On a **paid** invoice, click **Get customer portal link** — copy
    it, open it in an incognito window (no login) — you should see the
    invoice and be able to download its PDF.
17. Go to **Reviews** → **Request a review** → pick a customer → copy
    the generated link → open it in an incognito window → submit a
    rating. Back in **Reviews**, it should appear (marked "Verified"
    if tied to a paid invoice) — approve it, then respond to it.
18. Click the **bell icon** in the top bar — you should see
    notifications appear as you record payments, receive reviews, or
    let stock run low.
19. Go to **Referrals**, copy your link, and register a second test
    account through it (e.g. in an incognito window) — once that
    second account completes onboarding, your referral history should
    show it as "qualified."
20. Go to **Team** → invite a team member by email → if you register
    that email as a second account, it should attach to the business
    automatically.
21. Go to **Support** → open a ticket → reply to it → the thread
    should update.
22. Go to **Subscription** → choose a different plan → it should apply
    immediately (no real payment is charged — see the Phase 19 note).

## 7. Project structure

```
FRANKY-TECH/
  server/
    config/db.js               # PostgreSQL connection pool
    controllers/                # auth, business
    middleware/                 # security, error handling, auth/session
    models/                     # user, session, business (raw SQL)
    routes/                     # auth, businesses, dashboard, index
    services/                   # auth, business business-logic layer
    validators/                 # auth, business input validation
    utils/                      # password hashing, tokens, slugs, cookies
    db/migrate.js                # migration runner
    jobs/                       # (added in later phases)
    templates/                  # (added in later phases — PDF templates)
    app.js
    server.js
  client/
    index.html                  # landing page
    login.html
    register.html
    onboarding.html             # 4-step business setup wizard
    dashboard.html              # authenticated dashboard shell
    css/styles.css              # design system + landing page
    css/app.css                 # auth / onboarding / dashboard shell
    js/main.js                  # landing page behavior
    js/logo-animation.js
    js/auth.js                  # shared fetch/session helpers
    js/onboarding.js
    js/dashboard.js
    assets/logo/
    admin/                       # (added in later phases)
  migrations/
    0001_init.sql                # users, sessions, businesses, etc.
  seed/
    seed.js                      # development-only demo account
  tests/                        # (added in later phases)
  .env.example
  .gitignore
  package.json
  README.md
```

## 8. Deployment

Any Node.js-capable host works (Railway, Render, Fly.io, a VPS, etc.):

1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Set all required environment variables from `.env.example` on the host.
3. Set `NODE_ENV=production`.
4. Run `npm install --omit=dev` then `npm start` (or let your platform run
   these automatically).
5. Point your domain at the host and enable HTTPS — cookies and security
   headers in later phases assume HTTPS in production.

## 9. Security notes (Phases 1–5)

- Helmet sets protective HTTP headers, including a Content-Security-Policy.
- CORS is restricted to `APP_URL` by default.
- A general API rate limiter is active on all `/api` routes; a stricter
  limiter additionally applies to `/api/auth/*` (login, register, password
  reset) to slow down credential stuffing.
- Passwords are hashed with `crypto.scrypt` (a memory-hard KDF, salted,
  never stored or logged in plain text) and compared with a timing-safe
  check.
- Sessions are random 256-bit tokens; only their SHA-256 hash is stored in
  the database, set as an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in
  production).
- Every business-scoped API route re-checks that the logged-in user is
  actually a member of the requested business before returning or
  modifying anything — a `businessId` sent by the browser is never trusted
  on its own (`getOwnedBusinessOrThrow`).
- No secrets are ever sent to the frontend — only the public
  `/api/config/public` values (WhatsApp number, social links).
- Not yet implemented (by design, arriving in later phases): email
  verification delivery, password reset delivery, CSRF tokens, and
  full audit-log coverage — these are called out explicitly in
  Phase 25 (Security hardening) in the roadmap below.
- Every page's JavaScript lives in an external `.js` file — there are
  no inline `<script>` blocks and no inline event handler attributes
  (`onclick=`, etc.) anywhere in the project, including in
  dynamically-generated `innerHTML`. This is required by the strict
  Content-Security-Policy (`script-src 'self'`) set in
  `server/middleware/security.js`, and is checked by hand on every
  phase — see git history for the Phase 6-14 fix where two pages
  briefly violated this.

## 10. Troubleshooting

- **"DATABASE_URL is not set" warning on startup** — expected until you
  configure PostgreSQL; the landing page still works.
- **Port already in use** — change `PORT` in `.env`.
- **Fonts not loading** — check that outbound requests to
  `fonts.googleapis.com` / `fonts.gstatic.com` aren't blocked by your
  network or the Content-Security-Policy in `server/middleware/security.js`.

---

## Roadmap

Phase 1 (this repo) → Database → Authentication → Business onboarding →
Dashboard → Customers → Products/Services → Invoices → PDFs → Quotations →
Receipts/Payments → Expenses → Inventory → Reports → Reviews → Customer
portal → Referral system → Subscriptions → Payment gateway → Notifications
→ Automation → Team management → Support → Admin dashboard → Security
hardening → Testing → Performance → SEO → PWA → Production deployment.

When Phase 1 is confirmed working, say **"PHASE 1 COMPLETE"** to continue
to **Phase 2 — Database**.
