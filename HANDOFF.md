# Clawtner — Project Handoff

## Overview
Relationship CRM with scheduled iMessage delivery.

## Links
- **Live site:** https://clawtner.pages.dev
- **PIN:** 0000
- **Repo (local):** `/Users/jarquavius/.openclaw/workspace/projects/clawtner/`
- **Repo (GitHub):** https://github.com/jarquavius-jajalabs/clawtner

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

## Project Structure
```
src/                          # Frontend (React)
  App.tsx                     # Main app, routing, login, tab bar
  components/
    Queue.tsx                 # Swipe-to-approve message queue
    Contacts.tsx              # Contact list + detail
    ContactDetail.tsx         # Single contact view
    CyclePage.tsx             # Period/cycle tracker
    CycleTracker.tsx          # Cycle visualization
    Flowers.tsx               # Gift ordering
    History.tsx               # Sent messages log
    Settings.tsx              # Config, API keys
  lib/
    api.ts                    # API client (all fetch calls)
    types.ts                  # TypeScript interfaces
  styles.css                  # All CSS (single file)

functions/                    # Backend (Cloudflare Pages Functions)
  api/
    _middleware.ts            # Auth middleware (API key or JWT)
    auth/                     # PIN login, demo mode, API key management
    contacts/                 # CRUD + profile (Soul MD)
    contacts/[id]/profile.ts  # Key-value profile fields per contact
    drafts/                   # Draft CRUD + approval → iMessage queue
    schedules/                # Recurring schedule CRUD
    messages/                 # Send, queue polling, status reporting, webhook
    cycles/                   # Period tracking
    gifts/                    # Flower/gift ordering
    history/                  # Sent message history
    feedback/                 # Thumbs up/down + learning insights
  lib/
    auth.ts                   # SHA-256 hashing, JWT sessions
    db.ts                     # Env type, ID generation
    imessage.ts               # Queue messages for iMessage delivery
    twilio.ts                 # SMS/WhatsApp (kept for future)
    webhooks.ts               # Webhook fallback delivery
    floristone.ts             # Flower API

migrations/                   # D1 schema
  001_init.sql                # Contacts, drafts, channels, API keys, history, cycles
  002_flowers.sql             # Gift orders, contact addresses
  003_features.sql            # Love language, feedback, insights
  004_tier1.sql               # Schedules, contact_profile, message_log

scripts/
  imessage-sender.sh          # Cron script: polls queue, sends via imsg CLI
```

## Key Design Decisions
1. **auto_approve hardcoded to 0** — every message must be manually approved. Can't be changed via API. Safety feature.
2. **iMessage delivery is async** — approve → queue in D1 → Mac mini cron polls → imsg send → reports back via API. ~1 min delay max.
3. **Auth is PIN-based** — SHA-256 hash stored as Cloudflare secret. JWT session token lasts 7 days.
4. **Soul MD profiles** — flexible key-value pairs grouped by category (favorites, dislikes, triggers, inside_jokes, routines). AI draft generation will use these for personalized messages.
5. **Cycle tracker** — adjusts message tone by menstrual phase.

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
