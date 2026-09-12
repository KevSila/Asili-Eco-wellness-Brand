# Asili Eco-Wellness and Business Helper

Asili is a Kenyan eco-wellness brand beginning with raw honey from Makueni. This repository contains the existing two-page public website and the server-side foundation for the reusable Silatech Business Helper.

## Pages

- `/` — consumer-first brand story, value proposition, traceability preview and partnership inquiries
- `/honey/` — focused honey product page with direct WhatsApp ordering
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

`db:migrate` applies committed migrations and `db:seed` idempotently creates one inactive, zero-stock sample product. The sample is deliberately not suitable for publication. No migration or seed should be run against production until the target database and backup/rollback procedure have been reviewed.

Order creation is not part of Foundation Batch 1. When it is added, customer/order/item creation and conditional stock decrements must execute in one Prisma transaction; stock must never be updated in a separate request or after an order has already committed.

## API and production server

The Express application is assembled in `src/server/app.ts`. API routes live under `src/server/routes`, server-only database code lives under `src/server/db`, and `server.ts` is the process entry point.

- `GET /api/health` — lightweight process health check
- `GET /api/health/db` — database readiness check; returns `503` without database details when PostgreSQL is unavailable
- `POST /api/contact` — existing Resend-backed contact flow

The production build creates the Vite site and a Node.js server bundle:

```bash
npm run build
npm start
```

The server reads `PORT` from the environment and falls back to `3000` locally. For Railway, set `DATABASE_URL`, `NODE_ENV=production`, `RESEND_API_KEY`, and the optional contact sender/recipient variables. Use `npm run build` as the build command, `npm start` as the start command, and `npm run db:migrate` as a separately reviewed pre-deploy migration step.

Netlify remains the public static host. Foundation Batch 1 does not configure a Netlify `/api/*` proxy, so the public Netlify site is not connected to the Railway API yet.

## Production checks

```bash
npm run lint
npm run build
npm test
```

The Vite build produces separate static documents for the home and honey pages. SEO files are in `public/robots.txt` and `public/sitemap.xml`.

## Content notes

- Current jar sizes, prices and delivery details are confirmed through WhatsApp until the product catalogue is finalised.
- The Glass Hive batch passport is described as a system in rollout. Demo records must remain clearly marked and must not be presented as certificates.
- Add certification, compliance or performance claims only after the supporting evidence and public wording have been reviewed.
