# Asili Eco-Wellness and Business Helper

Asili is a Kenyan eco-wellness brand beginning with raw honey from Makueni. This repository contains the existing two-page public website and the server-side foundation for the reusable Silatech Business Helper.

## Pages

- `/` — consumer-first brand story, value proposition, traceability preview and partnership inquiries
- `/honey/` — focused honey product page with API-backed jar selection, order form and WhatsApp confirmation
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

Database integration tests are guarded to prevent accidental writes. Against an explicitly approved development database, set `RUN_DATABASE_TESTS=true` for the test process. The suite creates only clearly prefixed `[DEV TEST]` records and removes those records after verification.

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
| `PORT` | Do not set manually | No | Injected by Railway and consumed by the server. |

Do not set `RUN_DATABASE_TESTS` in Railway and never create a `VITE_DATABASE_URL` or any other browser-exposed database variable. If Railway Postgres connection pooling is enabled later, add and review an unpooled internal migration URL before changing the Prisma datasource; migrations should not be routed through a transaction-mode pooler.

The Railway health check uses `/api/health/db`, so a deployment is not promoted unless both Express and PostgreSQL are ready. Its failure response is a generic `503` and does not expose database credentials or internal errors. `/api/health` remains a lightweight process-only check.

Netlify remains the public static host. The root `netlify.toml` proxies same-origin `/api/*` requests to the Railway API while preserving the public site's relative API URLs. The proxy rule must remain before any future SPA catch-all redirect.

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
