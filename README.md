# Asili Eco-Wellness

Asili is a Kenyan eco-wellness brand beginning with raw honey from Makueni. This repository contains the two-page brand and product website deployed at [asilii.netlify.app](https://asilii.netlify.app/).

## Pages

- `/` — consumer-first brand story, value proposition, traceability preview and partnership inquiries
- `/honey/` — focused honey product page with direct WhatsApp ordering
- `/b/SAMPLE-2604-01.html` — no-index demonstration of the planned batch-passport interface

## Local development

Requirements: Node.js 20 or later.

```bash
npm install
npm run dev
```

The contact form posts to `/api/contact`. Set `RESEND_API_KEY` in `.env.local` to deliver inquiry emails through Resend.

## Production checks

```bash
npm run lint
npm run build
```

The Vite build produces separate static documents for the home and honey pages. SEO files are in `public/robots.txt` and `public/sitemap.xml`.

## Content notes

- Current jar sizes, prices and delivery details are confirmed through WhatsApp until the product catalogue is finalised.
- The Glass Hive batch passport is described as a system in rollout. Demo records must remain clearly marked and must not be presented as certificates.
- Add certification, compliance or performance claims only after the supporting evidence and public wording have been reviewed.
