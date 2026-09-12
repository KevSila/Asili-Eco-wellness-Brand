# Codex Handoff — Asili Business Helper MVP

## Repository
- Repo: `KevSila/Asili-Eco-wellness-Brand`
- Working branch: `feature/asili-business-helper-mvp`
- Production site: `https://asilii.netlify.app`
- Existing stack: React + Vite frontend, Express + TypeScript backend

## Current Asili context
Asili is a Kenyan eco-wellness brand beginning with raw, unheated honey from Makueni. The existing public site is already live and should remain visually and functionally intact unless a requested MVP feature requires a careful extension.

Current public functionality includes:
- main brand page
- honey page
- WhatsApp ordering/contact
- contact/partnership inquiry flow
- a demo batch-passport concept

Do not introduce unsupported certification, health, compliance, traceability, or performance claims.

## Goal
Turn Asili into the first working prototype of a reusable **Silatech Business Helper** for Kenyan SMEs that sell goods or services.

The first version should prove that a small business can manage customers, products, orders, payments, stock and follow-ups from one lightweight system without requiring WhatsApp Business API or paid automation platforms.

Asili is the first implementation, but keep backend/data concepts generic enough to reuse later.

## MVP scope

### Customer-facing
1. Preserve the existing Asili public site and branding.
2. Add a simple product catalogue / buy flow for honey.
3. Allow product/variant and quantity selection.
4. Add a simple order form capturing at minimum name, phone, optional email, location/delivery area, product, quantity, and note.
5. Persist orders to PostgreSQL.
6. Show a clear order confirmation state/page.
7. Add click-to-WhatsApp links with prefilled order/enquiry text. Do NOT require WhatsApp Cloud API.

### Owner/admin
Create an admin area separate from the public storefront with:
- Dashboard
- Products
- Orders
- Customers
- Payments
- Follow-ups

Dashboard should show simple metrics such as sales total, order count, pending payments, orders awaiting delivery, low stock, customer count and follow-ups due.

## Recommended data model
Use PostgreSQL.

Entities:
- Customer
- Product
- Order
- OrderItem
- Payment
- FollowUp

Suggested statuses:
- order: `new`, `confirmed`, `processing`, `dispatched`, `delivered`, `cancelled`
- payment: `pending`, `partially_paid`, `paid`, `refunded`
- delivery: `pending`, `scheduled`, `dispatched`, `delivered`
- follow-up: `open`, `done`, `cancelled`

## Technical direction
Prefer the existing stack unless there is a compelling reason to change it.

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Database: PostgreSQL
- ORM: Prisma preferred
- Backend/database hosting target: Railway
- Existing public deployment: Netlify can remain initially if practical
- Source of truth: GitHub

Use `DATABASE_URL` from the environment. Never hard-code credentials, tokens, passwords or API keys.

## API direction
Suggested MVP routes:
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id`
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/payments`
- `PATCH /api/payments/:id`
- `GET /api/follow-ups`
- `POST /api/follow-ups`
- `PATCH /api/follow-ups/:id`

Use input validation and safe error responses.

## Admin authentication
For MVP, use a minimal but non-public protection mechanism suitable for a prototype. Keep it easy to replace later with proper authentication. Never commit plaintext passwords/secrets.

## WhatsApp for MVP
No WhatsApp Business / Cloud API integration yet.

Use only click-to-WhatsApp deep links with prefilled text. Do not use unofficial WhatsApp Web automation libraries.

## M-Pesa for MVP
Do not integrate Daraja yet.

Support manual payment capture only:
- method
- amount
- M-Pesa/reference code
- payment status

Keep the model future-ready for Daraja.

## Explicitly out of scope for Phase 1
- WhatsApp Cloud API automation
- M-Pesa Daraja integration
- AI chatbot / AI reply assistant
- automated SMS/email/WhatsApp sequences
- multi-tenant SaaS architecture
- advanced accounting
- complex role-based access control

## Reusability requirement
Brand the UI for Asili, but keep service names, database concepts and backend logic generic where practical: customer, product, order, payment, followUp, orderItem, etc.

## Preserve existing behavior
Before implementation:
1. Inspect the full repository.
2. Run the current app locally.
3. Run lint and build.
4. Identify how multi-page Vite build, `/honey/`, `/api/contact`, SEO files and Netlify deployment work.
5. Avoid breaking existing URLs, SEO, public content or contact functionality.

## Implementation sequence
1. Audit current architecture and report it.
2. Add Prisma/PostgreSQL foundation.
3. Add schema, migration and seed setup.
4. Implement products + orders API first.
5. Build customer order flow.
6. Add admin dashboard shell.
7. Add order/customer/product management.
8. Add manual payments and follow-ups.
9. Add click-to-WhatsApp helpers.
10. Run lint/build/tests and fix regressions.
11. Update README with local + Railway setup instructions.

## Working style
- Make incremental, reviewable changes.
- Do not redesign the public Asili site without explicit instruction.
- Reuse existing styles/components where sensible.
- Keep mobile usability high.
- Prefer maintainable code over clever abstractions.
- Explain major architecture decisions in plain English.
- Flag destructive changes before proceeding.

## Definition of done
1. Customer can place an Asili honey order.
2. Customer/order data persists in PostgreSQL.
3. Products/stock are stored in PostgreSQL.
4. Owner can view real database data in an admin dashboard.
5. Owner can update order/payment/delivery status.
6. Owner can record manual M-Pesa/payment references.
7. Owner can create/complete follow-ups.
8. Click-to-WhatsApp works without WhatsApp API.
9. Existing public pages continue to work.
10. Setup and Railway deployment are documented.

## First Codex task
Start by auditing the branch and current app. Do not immediately rewrite files. Return:
- current architecture summary
- important files/directories
- current deployment assumptions
- proposed Prisma/database integration plan
- risks to existing Netlify deployment
- exact first implementation batch you recommend

After the audit, stop and wait for approval before major implementation.