# Asili Eco-Wellness and Business Helper

Asili is a Kenyan eco-wellness brand beginning with raw honey from Makueni. This repository contains the existing two-page public website and the server-side foundation for the reusable Silatech Business Helper.

## Pages

- `/` — consumer-first brand story, value proposition, traceability preview and partnership inquiries
- `/honey/` — focused honey product page with API-backed jar selection, order form and WhatsApp confirmation
- `/admin/` — owner sign-in and protected operations dashboard (no-index)
- `/b/SAMPLE-2604-01.html` — no-index demonstration of the planned batch-passport interface

## Local development

Requirements: Node.js 20 or later. PostgreSQL is needed for migrations and seeds, but the existing public site and API smoke tests can run without a database connection.

```bash
npm install
npm run prisma:generate
npm run dev
```

The contact form posts to `/api/contact`. Set `RESEND_API_KEY` in `.env` to deliver inquiry emails through Resend.

The development server defaults to port `3000`. Copy `.env.example` to `.env` and set `DATABASE_URL` when working with the database. `DATABASE_URL` is server-only and must never be renamed to, copied into, or exposed through a `VITE_*` variable.

## Database foundation

Prisma models are defined in `prisma/schema.prisma`. The foundation includes customers, products, product variants, orders, order items, payments and follow-ups. Monetary amounts use integer minor units: for KES, `12500` represents KSh 125.00. Order items retain product-name, variant-name, SKU and unit-price snapshots so historical orders do not change when catalogue records change.

```bash
npm run prisma:validate
npm run db:migrate
npm run db:seed
```

`db:migrate` applies committed migrations. `db:seed` idempotently preserves the inactive zero-value sample and publishes the confirmed Asili honey catalogue: 500g at KES 600 and 1kg at KES 1,200. Their stock is `NULL`, meaning availability has not been confirmed. Re-running the seed updates catalogue wording and prices but deliberately does not overwrite an existing stock value.

## API and production server

The Express application is assembled in `src/server/app.ts`. API routes live under `src/server/routes`, server-only database code lives under `src/server/db`, and `server.ts` is the process entry point.

- `GET /api/health` — lightweight process health check
- `GET /api/health/db` — database readiness check; returns `503` without database details when PostgreSQL is unavailable
- `GET /api/products` — active products that have at least one active variant
- `GET /api/products/:slug` — one active public product by slug
- `POST /api/orders` — validated, idempotent customer order creation with atomic stock reservation when stock is known
- `POST /api/contact` — existing Resend-backed contact flow
- `POST /api/admin/auth/login` — owner authentication and secure session cookie
- `GET /api/admin/auth/session` — current authenticated owner session and CSRF token
- `POST /api/admin/auth/logout` — CSRF-protected logout
- `GET /api/admin/dashboard` — protected operational metrics, recent activity and catalogue availability
- `GET /api/admin/orders` — protected order list
- `GET /api/admin/orders/:orderNumber` — protected order detail
- `PATCH /api/admin/orders/:orderNumber/statuses` — protected, CSRF-checked status transitions
- `GET /api/admin/inventory` — protected active-variant stock and recent movement history
- `POST /api/admin/inventory/:variantId/movements` — protected, CSRF-checked stock adjustment
- `POST /api/admin/sales` — protected, CSRF-checked manual/offline sale creation
- `GET /api/admin/customers` — protected customer sales aggregation

### Owner authentication

The initial dashboard supports one server-configured owner while keeping authentication behind an `AdminAuthService` boundary for a later database-backed users and roles model. The password is stored only as a salted scrypt hash. Session data is signed with HMAC-SHA-256 and stored in an HTTP-only cookie; production uses a `__Host-` cookie with `Secure`, `SameSite=Strict`, `Path=/` and no domain. Admin responses are marked `Cache-Control: no-store`.

Generate the password hash locally in an interactive terminal. The password is not echoed:

```bash
npm run admin:hash-password
```

Every session includes an unpredictable CSRF token returned after login. The dashboard sends it in `X-CSRF-Token` for status updates and logout. Failed logins are limited to five per IP per 15 minutes; successful logins do not consume the failure quota. As with public order limiting, use a shared limiter store before increasing Railway beyond one API replica.

### Inventory, sales sources and owner notifications

`ProductVariant.stockQuantity` keeps its three-state meaning: `NULL` is unconfirmed, `0` is confirmed out of stock, and a positive integer is confirmed available stock. Opening counts, receipts, damage/loss, corrections, returns, unconfirmed resets, online sales and manual sales create immutable `InventoryMovement` rows with before/after snapshots. Conditional stock updates and the movement write occur in the same transaction, and known stock cannot become negative.

Orders carry a source of `website`, `manual`, `whatsapp`, `phone` or `walk_in`. Manual sales use the same order, item snapshot, payment and customer structures as website orders. A phone-backed customer is normalized and reused; a name-only sale receives a customer record without an invented phone; an anonymous sale remains unlinked while retaining its optional order snapshots.

After a new, non-replayed website order commits, the server sends an owner email through Resend. Notification failure is logged without customer details and never rolls back the order. Set `ORDER_NOTIFICATION_TO_EMAIL` or allow it to fall back to `CONTACT_TO_EMAIL`; set `ADMIN_PUBLIC_URL` to include a direct protected order link.

The dashboard sales summary uses `Africa/Nairobi` calendar boundaries, with weeks beginning Monday. Product sales value is the product subtotal of non-cancelled, non-refunded orders. Paid revenue includes only fully paid orders; pending and partially paid order value is reported separately as awaiting payment. Monthly units and channel totals use the same rules. Delivery fees, costs, profit, margin, VAT and refunded orders are intentionally excluded because they are not reliable revenue measures in the current model.

Netlify must serve the `/admin/` login shell, so the static HTML itself contains no private data. All metrics, customers, orders and mutations are loaded exclusively through authenticated `/api/admin/*` endpoints.

Order requests use this shape:

```json
{
  "customer": {
    "name": "Customer name",
    "phone": "0712 345 678",
    "email": "optional@example.com"
  },
  "deliveryLocation": "Nairobi CBD",
  "customerNote": "Optional delivery note",
  "items": [
    { "variantId": "database-variant-id", "quantity": 2 }
  ]
}
```

Every order request must include an `Idempotency-Key` header containing a UUID. Replaying the same key and normalized payload returns the original order without another stock change; reusing a key for different order details returns `409`. The public route permits 10 attempts per IP per 15 minutes and returns a safe `429` response. This in-memory limit is suitable for one Railway process; use a shared rate-limit store before scaling to multiple API replicas.

Names, SKUs, prices, currencies, totals and stock are always read or calculated by the server. Kenyan mobile numbers are stored as `+254` followed by nine national digits. Order references default to `ASILI-YYMMDD-XXXXXX`; `ORDER_REFERENCE_PREFIX` can provide a future client-specific prefix without changing database concepts.

Order creation loads the current catalogue and executes conditional stock decrements, customer upsert, order creation and snapshot item creation in one PostgreSQL transaction. Conditional `stock_quantity >= quantity` updates prevent competing orders from producing negative inventory. A `NULL` stock quantity means unconfirmed availability: the public catalogue returns `availableStock: null`, the order can be recorded for confirmation, and no inventory value is invented or decremented. A known value of `0` means unavailable.

Database integration tests are guarded to prevent accidental writes. They require `RUN_DATABASE_TESTS=true` and a separate `TEST_DATABASE_URL`; `DATABASE_URL` is never a fallback and the two URLs may not identify the same host/database. Remote test databases and database names without `test` are rejected unless their dedicated override flags are explicitly set after verifying that the target is disposable. The suite creates only clearly prefixed `[DEV TEST]` records and removes those records after verification. Never set these test flags in Railway production.

Admin payments are an append-only receipt ledger. Each actual receipt records integer minor units, method, optional reference/note and receipt time. Only `paid` ledger rows contribute to amount received; preserved legacy pending/partial rows are shown but are not treated as proof that money was received. The order payment status is derived as pending, partially paid or paid after each new receipt, and overpayments are rejected transactionally.

Customer lifecycle email uses the existing server-only Resend configuration. A receipt is sent after a new non-replayed website order, and one email per order may be sent when it is dispatched, delivered, cancelled or refunded. The additive `notification_logs` table provides durable per-event deduplication and delivery status; an email failure is recorded and does not roll back the underlying order/status transaction. Deploy `20260913150000_customer_notification_log` with the standard pre-deploy migration command before this code receives traffic.

The production build creates the Vite site and a Node.js server bundle:

```bash
npm run build
npm start
```

The server reads `PORT` from the environment, binds to `0.0.0.0`, and falls back to `3000` locally. It handles Railway's `SIGTERM` shutdown signal by stopping the HTTP server and disconnecting Prisma.

### Railway service preparation

Create the API as a Railway service from this repository and select the Railpack builder. Enter these exact values in the service settings:

```text
Build:      npm run build
Pre-deploy: npx prisma migrate deploy
Start:      npm start
Health:     /api/health/db
```

Set the health-check timeout to `100` seconds, the pre-deploy timeout to `300` seconds, and begin with one API replica because order rate limiting is currently in-memory. Config-as-Code via `railway.json` is intentionally not used because Railway has deprecated it for new services; these settings should be entered manually during this deployment batch.

The build runs `prisma generate` before producing the Vite client and Node server bundles. The Prisma CLI is a production dependency so the separate Railway pre-deploy container can run committed migrations even if development dependencies are pruned. Set `RAILPACK_NODE_VERSION=22` so Railway uses the verified Node.js major; `package.json` accepts supported Node versions from 20 through 24 for local compatibility.

Configure the API service's Railway Variables as follows:

| Variable | Requirement | Secret | Railway value/notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Required | Yes | Reference the Postgres service's private `DATABASE_URL`, for example `${{Postgres.DATABASE_URL}}`. Do not use `DATABASE_PUBLIC_URL` or the local-development TCP proxy URL. |
| `NODE_ENV` | Required | No | `production` (Railpack also supplies this at runtime). |
| `RAILPACK_NODE_VERSION` | Required build setting | No | `22`, matching the deployment verification target. |
| `RAILPACK_NODE_NPM_INSTALL` | Recommended build setting | No | `npm ci` for deterministic installation from `package-lock.json`. |
| `RAILPACK_PRUNE_DEPS` | Recommended build setting | No | `true`; Vite remains build-only while Prisma remains available for pre-deploy migrations. |
| `RESEND_API_KEY` | Required for email delivery | Yes | Resend server API key. Without it, `/api/contact` retains its existing accepted-without-delivery fallback. |
| `CONTACT_FROM_EMAIL` | Recommended for email delivery | No | A Resend-authorized sender identity. |
| `CONTACT_TO_EMAIL` | Recommended | Treat as private operational configuration | Destination inbox for contact submissions. |
| `ORDER_REFERENCE_PREFIX` | Optional | No | Defaults to `ASILI`; accepts 2–10 uppercase letters/numbers. |
| `ADMIN_EMAIL` | Required for admin | Treat as private | Normalized owner sign-in email; never expose through Vite. |
| `ADMIN_PASSWORD_HASH` | Required for admin | Yes | Salted scrypt value generated by `npm run admin:hash-password`; never store plaintext. |
| `ADMIN_SESSION_SECRET` | Required for admin | Yes | At least 32 high-entropy characters used to sign sessions. Rotation signs out existing sessions. |
| `ADMIN_SESSION_HOURS` | Optional | No | Defaults to `8`; accepted values are capped at 24 hours. |
| `ORDER_NOTIFICATION_TO_EMAIL` | Recommended | Treat as private | Owner inbox for new website-order notifications; falls back to `CONTACT_TO_EMAIL`. |
| `ADMIN_PUBLIC_URL` | Recommended | No | Public `/admin/` URL used for protected order links in notification emails. |
| `PORT` | Do not set manually | No | Injected by Railway and consumed by the server. |

Do not set `RUN_DATABASE_TESTS` in Railway and never create a `VITE_DATABASE_URL` or any other browser-exposed database variable. If Railway Postgres connection pooling is enabled later, add and review an unpooled internal migration URL before changing the Prisma datasource; migrations should not be routed through a transaction-mode pooler.

The Railway health check uses `/api/health/db`, so a deployment is not promoted unless both Express and PostgreSQL are ready. Its failure response is a generic `503` and does not expose database credentials or internal errors. `/api/health` remains a lightweight process-only check. Both endpoints expose only the safe Railway environment name supplied by the built-in `RAILWAY_ENVIRONMENT_NAME` variable (or `local` outside Railway); they do not expose environment IDs or connection details.

Netlify remains the public static host. Configure the build-only `API_PROXY_TARGET` variable by Netlify deploy context: use the production Railway API origin for Production and the staging Railway API origin for Deploy Previews and the staging branch. After Vite finishes, `scripts/generate-netlify-redirects.mjs` writes the context-specific same-origin `/api/*` proxy into `dist/_redirects`. Netlify builds fail when the variable is missing; ordinary local builds skip proxy generation. The variable is never exposed through Vite, and `netlify.toml` contains no hardcoded Railway origin. Keep the generated API rule before any future SPA catch-all redirect.

## Production checks

```bash
npm run lint
npm run build
npm test
```

The Vite build produces separate static documents for the home and honey pages. SEO files are in `public/robots.txt` and `public/sitemap.xml`.

## Content notes

- Confirmed jar prices are KES 600 for 500g and KES 1,200 for 1kg. Delivery is location-based, excluded from the product subtotal and confirmed separately.
- The Glass Hive batch passport is described as a system in rollout. Demo records must remain clearly marked and must not be presented as certificates.
- Add certification, compliance or performance claims only after the supporting evidence and public wording have been reviewed.
