# Clawtner v2 — Architecture

**What it is:** A relationship CRM with scheduled smart messages. No agent required. You load contacts, build their profile, schedule messages, approve drafts, Twilio delivers.

**Stack:** Cloudflare Pages (frontend) + Pages Functions (API) + D1 (database) + Twilio (SMS/WhatsApp) + Stripe (billing, later)

---

## Core Flow

```
User signs up → Adds contact → Fills profile (soul md) → Sets schedule
                                                              ↓
                              System generates draft → Shows in approval queue
                                                              ↓
                              User approves/edits → Twilio sends at scheduled time
                                                              ↓
                              Delivery confirmed → Logged in history → Feedback loop
```

---

## Database Schema (D1)

### Existing (keep as-is)
- `contacts` — name, phone, email, relationship, tone, preferences, special_dates, address, gift_preferences, love_language
- `drafts` — message, category, status (pending/approved/sent/rejected), suggested_time, approved_at, sent_at
- `history` — sent messages log with delivery status
- `cycles` — period tracking per contact
- `cycle_logs` — daily cycle data (flow, mood, energy, symptoms)
- `gifts` — flower/gift orders
- `feedback` — thumbs up/down, edits, response tracking
- `insights` — aggregated learning per contact
- `api_keys` — API auth (keep for external integrations)

### New Tables

```sql
-- User accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,                        -- their own number (Twilio sends FROM this or a pool number)
  timezone TEXT DEFAULT 'America/Los_Angeles',
  onboarding_step INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free',          -- free | pro | unlimited
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Link contacts to users (multi-tenant)
-- ADD COLUMN to contacts:
-- user_id TEXT NOT NULL REFERENCES users(id)

-- Schedules (recurring message rules)
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  name TEXT,                         -- "Good morning text", "Weekly check-in"
  type TEXT NOT NULL,                -- daily | weekly | monthly | yearly | custom
  time TEXT NOT NULL,                -- "08:00" (in user's timezone)
  days_of_week TEXT,                 -- JSON: [1,3,5] for Mon/Wed/Fri (weekly type)
  day_of_month INTEGER,             -- 1-31 (monthly type)
  month_day TEXT,                    -- "03-14" for Mar 14 (yearly type, anniversaries)
  category TEXT DEFAULT 'general',   -- good-morning | check-in | love-note | reminder | custom
  prompt_context TEXT,               -- extra context for AI draft generation
  auto_approve INTEGER DEFAULT 0,   -- 0 = queue for approval, 1 = send automatically
  active INTEGER DEFAULT 1,
  last_fired INTEGER,
  next_fire INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Twilio message log (delivery tracking)
CREATE TABLE IF NOT EXISTS message_log (
  id TEXT PRIMARY KEY,
  history_id TEXT REFERENCES history(id),
  twilio_sid TEXT,                    -- Twilio message SID
  from_number TEXT,
  to_number TEXT,
  channel TEXT DEFAULT 'sms',        -- sms | whatsapp
  status TEXT,                       -- queued | sent | delivered | failed | undelivered
  error_code TEXT,
  error_message TEXT,
  price TEXT,                        -- cost in USD
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Contact profile fields (the "soul md" — flexible key-value)
CREATE TABLE IF NOT EXISTS contact_profile (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  category TEXT NOT NULL,            -- basics | favorites | dislikes | triggers | inside_jokes | routines
  key TEXT NOT NULL,                 -- "favorite_flower", "hates_mornings", "inside_joke_about_pickles"
  value TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_profile_contact ON contact_profile(contact_id);
CREATE INDEX IF NOT EXISTS idx_schedules_next ON schedules(next_fire);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_message_log_sid ON message_log(twilio_sid);
```

---

## API Routes

### Auth
```
POST /api/auth/register        — email + password signup
POST /api/auth/login           — returns JWT
POST /api/auth/forgot          — password reset email
GET  /api/auth/me              — current user
```

### Contacts
```
GET    /api/contacts           — list user's contacts
POST   /api/contacts           — create contact
GET    /api/contacts/:id       — get contact + profile
PUT    /api/contacts/:id       — update contact
DELETE /api/contacts/:id       — delete contact
```

### Contact Profile (Soul MD)
```
GET    /api/contacts/:id/profile          — all profile fields
POST   /api/contacts/:id/profile          — add profile field
PUT    /api/contacts/:id/profile/:field   — update field
DELETE /api/contacts/:id/profile/:field   — remove field
```

### Schedules
```
GET    /api/schedules                     — list all schedules
POST   /api/schedules                     — create schedule
PUT    /api/schedules/:id                 — update schedule
DELETE /api/schedules/:id                 — delete schedule
POST   /api/schedules/:id/pause           — pause
POST   /api/schedules/:id/resume          — resume
```

### Drafts / Approval Queue
```
GET    /api/drafts?status=pending         — approval queue
POST   /api/drafts                        — create draft manually
PUT    /api/drafts/:id                    — edit draft
POST   /api/drafts/:id/approve            — approve (queues for send)
POST   /api/drafts/:id/reject             — reject
POST   /api/drafts/:id/regenerate         — AI generates a new version
```

### Messages (Twilio)
```
POST   /api/messages/send                 — send approved draft now
POST   /api/messages/webhook              — Twilio status callback
GET    /api/messages/log                  — delivery log
```

### Cycles
```
GET    /api/contacts/:id/cycles           — cycle history
POST   /api/contacts/:id/cycles           — log new cycle
PUT    /api/cycles/:id                    — update cycle
POST   /api/contacts/:id/cycles/import    — bulk import (CSV/JSON)
GET    /api/contacts/:id/cycles/predict   — predicted next period, fertile window, moods
```

### Gifts
```
GET    /api/gifts/products                — browse flowers/gifts
POST   /api/gifts                         — place order
GET    /api/gifts/:id                     — order status
```

### Analytics
```
GET    /api/analytics/dashboard           — overview stats
GET    /api/analytics/contact/:id         — per-contact relationship score
GET    /api/analytics/streaks             — message streaks, gaps
```

### History
```
GET    /api/history                       — all sent messages
GET    /api/history/contact/:id           — per-contact history
```

---

## Twilio Integration

### Setup
- One Twilio number per user (or shared pool on free tier)
- Environment vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- Store in Cloudflare Workers secrets

### Sending Flow
1. Cron trigger fires every minute: `SELECT * FROM schedules WHERE next_fire <= now AND active = 1`
2. For each due schedule → generate draft (AI or template) → insert into `drafts` with status `pending`
3. If `auto_approve = 1` → immediately queue for send
4. Otherwise → sits in approval queue until user approves
5. On approve → call Twilio API → log to `message_log` → update `history`
6. Twilio webhook updates delivery status

### Channels
- **SMS:** Twilio Programmable SMS ($0.0079/msg)
- **WhatsApp:** Twilio WhatsApp Business API ($0.005-0.08/msg depending on region)
- **Email:** Cloudflare Email Workers (free) or SendGrid

### Cron Worker
Cloudflare Workers Cron Trigger — runs every minute:
```
[triggers]
crons = ["* * * * *"]
```

Jobs:
1. Check schedules → generate drafts
2. Send approved drafts whose `suggested_time` has passed
3. Update delivery statuses
4. Generate cycle-aware reminders ("her period starts in 2 days, be extra nice")

---

## Contact Profile ("Soul MD")

Structured categories for each contact:

| Category | Example Fields |
|----------|---------------|
| **basics** | birthday, anniversary, how_we_met, pet_names |
| **favorites** | flower, restaurant, color, movie, song, food, drink |
| **dislikes** | hates_mornings, allergic_to, topics_to_avoid |
| **triggers** | stress_triggers, things_that_cheer_her_up, comfort_food |
| **inside_jokes** | the_pickle_incident, that_time_in_vegas |
| **routines** | gym_schedule, work_hours, morning_routine |
| **love_language** | primary (already on contacts), acts_of_service_examples |
| **communication** | preferred_text_length, emoji_use, response_speed |

The AI draft generator pulls ALL of this when writing messages. So if she hates mornings and loves coffee, a Monday morning text might be: "I know Mondays suck. Got you a coffee in spirit. You got this."

---

## Cycle-Aware Messaging

Already have the schema. The intelligence layer:

- **Predict phase:** Based on logged cycles, predict current phase (menstrual, follicular, ovulation, luteal)
- **Adjust tone:** Luteal/PMS phase → softer, more supportive messages. Ovulation → more playful/flirty
- **Smart reminders:** "Period likely starting in 2 days" → auto-queue a comfort draft
- **Import:** Support CSV upload and manual entry. API for syncing from Flo/Clue if they have export.

---

## Relationship Analytics (Mobalytics Style)

Scores per contact (0-100):

| Metric | How It's Calculated |
|--------|-------------------|
| **Consistency** | Are you messaging on schedule? Gaps = score drops |
| **Responsiveness** | How fast do they reply? (if tracked) |
| **Effort** | Gifts sent, message length, variety of categories |
| **Streak** | Consecutive days/weeks of contact |
| **Sentiment** | Feedback thumbs up/down ratio |
| **Overall** | Weighted average of all above |

Visual: radar chart (like Mobalytics champion stats). Each axis is a metric. Shows you where you're strong and where you're slipping.

---

## Onboarding Flow

5 steps, keep it tight:

1. **Sign up** — email + password (or Google OAuth later)
2. **Add your first contact** — name + phone number + relationship type
3. **Quick profile** — 5 key questions: birthday, love language, 3 favorite things
4. **Set first schedule** — pick a template: "Good morning texts" / "Weekly date night reminder" / "Custom"
5. **Approve first draft** — system generates one immediately, user sees the queue in action

Done. They're using the product in under 2 minutes.

---

## Monetization (Stripe, later)

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 1 contact, 30 msgs/month, no WhatsApp |
| **Pro** | $9/mo | 5 contacts, 200 msgs/month, WhatsApp, analytics |
| **Unlimited** | $19/mo | Unlimited contacts, unlimited msgs, flowers, API access |

Twilio costs are pass-through (pennies). Real margin is on the software.

---

## Build Order

### Phase 1 — Core (1-2 weeks)
- [ ] User auth (register/login/JWT)
- [ ] Multi-tenant contacts (add user_id)
- [ ] Contact profiles (soul md)
- [ ] Schedule CRUD
- [ ] Draft generation (template-based first, AI later)
- [ ] Approval queue (already exists, wire to schedules)
- [ ] Twilio SMS send
- [ ] Cron worker (schedule → draft → send)
- [ ] Onboarding flow

### Phase 2 — Intelligence (1 week)
- [ ] AI draft generation (OpenAI/Claude API, profile-aware)
- [ ] Cycle-aware draft adjustments
- [ ] Cycle import (CSV)
- [ ] Cycle predictions

### Phase 3 — Multi-channel + Analytics (1 week)
- [ ] WhatsApp via Twilio
- [ ] Email via SendGrid or CF Email Workers
- [ ] Relationship analytics dashboard
- [ ] Streak tracking
- [ ] Radar chart visualization

### Phase 4 — Monetization + Polish (1 week)
- [ ] Stripe integration
- [ ] Plan limits enforcement
- [ ] PWA manifest + offline support
- [ ] Flowers API integration
- [ ] Media attachments (MMS via Twilio)

---

## Environment Variables (Cloudflare Workers Secrets)

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
JWT_SECRET=...
OPENAI_API_KEY=... (for draft generation)
STRIPE_SECRET_KEY=... (phase 4)
STRIPE_WEBHOOK_SECRET=... (phase 4)
```
