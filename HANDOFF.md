# Clawtner — Project Handoff

## Overview
Relationship CRM with scheduled iMessage delivery.

## Links
- **Live site:** https://clawtner.pages.dev
- **PIN:** 0000
- **Repo:** `/Users/jarquavius/.openclaw/workspace/projects/clawtner/`

## Stack
- **Frontend:** Vite + React (TypeScript), `src/`
- **Backend:** Cloudflare Pages Functions, `functions/`
- **Database:** Cloudflare D1 (clawtner-db, ID: `9711f9df-8d6d-4200-82a2-324653b82259`)
- **Delivery:** iMessage via `imsg` CLI on Mac mini
- **Hosting:** Cloudflare Pages (project name: "clawtner")

## Architecture
Full doc: `ARCHITECTURE-V2.md` (schema, API routes, build phases)

## What's Built (Tier 1 Backend)
- Contacts CRUD with birthday/anniversary/last_contacted
- Contact profiles "Soul MD" (flexible key-value per contact, grouped by category)
- Drafts + approval queue (swipe to approve/reject)
- Schedules CRUD (daily/weekly/monthly/yearly recurring rules)
- iMessage delivery: approve → queue → Mac mini polls → imsg sends → reports back
- `auto_approve` hardcoded to 0 (safety feature, can't be changed)
- Twilio lib kept for WhatsApp later
- Webhook fallback for contacts without phone numbers
- Cycle/period tracking
- Flowers/gifts
- Feedback + learning insights
- Message history + delivery log

## API Routes
| Area | Routes |
|------|--------|
| Auth | `POST /api/auth/pin` |
| Contacts | `GET/POST /api/contacts`, `GET/PATCH/DELETE /api/contacts/:id` |
| Profiles | `GET/POST/DELETE /api/contacts/:id/profile` |
| Schedules | `GET/POST /api/schedules`, `GET/PATCH/DELETE /api/schedules/:id` |
| Drafts | `GET/POST /api/drafts`, `GET/PATCH/DELETE /api/drafts/:id` |
| Messages | `POST /api/messages/send`, `GET /api/messages/queued`, `POST /api/messages/status`, `POST /api/messages/webhook` |
| Cycles | `GET/POST /api/contacts/:id/cycles` |
| Gifts | `GET/POST /api/gifts` |
| History | `GET /api/history` |

## Secrets (Cloudflare)
**Set:**
- `AUTH_PIN_HASH` (PIN: 0000)
- `JWT_SECRET`

**Not yet set:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (for WhatsApp later)

## Local Delivery
- Sender script: `scripts/imessage-sender.sh`
- Needs cron setup + API key configured on Mac mini

## Migrations
- `001_init.sql`, `002_flowers.sql`, `003_features.sql`, `004_tier1.sql`

## Key Files (Read First)
- `ARCHITECTURE-V2.md` — the full plan
- `src/lib/types.ts` — all TypeScript types
- `src/lib/api.ts` — frontend API client
- `functions/lib/db.ts` — Env type
- `functions/lib/imessage.ts` — iMessage queue logic
- `src/styles.css` — all styling

## Deploy
```bash
cd projects/clawtner && npm run build && npx wrangler pages deploy dist --project-name clawtner
```

## What's Left to Build
- [ ] Frontend UI for schedules (backend ready, no screen yet)
- [ ] Frontend UI for contact profiles/Soul MD (backend ready, no screen yet)
- [ ] AI draft generation (OpenAI/Claude API to write messages based on profile)
- [ ] Cron worker on Cloudflare for firing schedules → generating drafts
- [ ] Set up `imessage-sender.sh` cron on Mac mini
- [ ] Run `004_tier1.sql` migration on production D1
- [ ] Onboarding flow
- [ ] Relationship analytics (Tier 3)
- [ ] Stripe billing (Tier 3)

---
*Handoff created: 2026-03-31*
