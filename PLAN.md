# Clawtner — Build Plan

## Goal
Agent-agnostic relationship message queue with human-in-the-loop approval. Open source. Self-hostable.

## Phase 1: Core API + MVP UI (Week 1)

### 1.1 Project Setup `[ ]`
- Cloudflare Workers + Pages project (wrangler)
- D1 database
- TypeScript
- React frontend (Vite)

### 1.2 Database Schema `[ ]`

```sql
-- Contacts you message
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  channel TEXT DEFAULT 'webhook',
  relationship TEXT,
  tone TEXT,
  preferences TEXT, -- JSON
  special_dates TEXT, -- JSON [{name, date}]
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Message drafts from agents
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending', -- pending | approved | rejected | sent | failed
  suggested_time INTEGER,
  approved_at INTEGER,
  sent_at INTEGER,
  edited_message TEXT, -- if user edited before approving
  metadata TEXT, -- JSON {agent, context, etc}
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Delivery channels (webhooks)
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'webhook',
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST',
  headers TEXT, -- JSON
  contact_ids TEXT, -- JSON array of contact IDs this channel serves
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- API keys for agents
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT DEFAULT '["drafts:write"]', -- JSON
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  last_used INTEGER
);

-- Sent message history
CREATE TABLE history (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  message TEXT NOT NULL,
  channel_id TEXT REFERENCES channels(id),
  status TEXT DEFAULT 'sent', -- sent | delivered | failed
  delivered_at INTEGER,
  error TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
```

### 1.3 API Routes `[ ]`

```
# Auth
POST   /api/auth/pin          — verify PIN for phone UI
POST   /api/auth/keys         — create API key

# Drafts
POST   /api/drafts            — agent pushes a draft
GET    /api/drafts             — list drafts (filter by status, contact)
GET    /api/drafts/:id         — get single draft
PATCH  /api/drafts/:id         — approve/reject/edit/reschedule
DELETE /api/drafts/:id         — delete draft

# Contacts
POST   /api/contacts          — add contact
GET    /api/contacts           — list contacts
GET    /api/contacts/:id       — get contact with stats
PATCH  /api/contacts/:id       — update contact
DELETE /api/contacts/:id       — remove contact

# Channels
POST   /api/channels           — add delivery channel
GET    /api/channels            — list channels
PATCH  /api/channels/:id        — update channel
DELETE /api/channels/:id        — remove channel

# History
GET    /api/history             — sent message log
GET    /api/history/:contact_id — history for specific contact
```

### 1.4 Mobile PWA `[ ]`
- Approval queue — swipeable cards
- Contact management
- History view
- Settings (PIN, API keys)
- Install prompt for home screen

### 1.5 Webhook Delivery `[ ]`
- On approve: fire webhook to matched channel
- Retry logic (3 attempts, exponential backoff)
- Log results to history table

## Phase 2: OpenClaw Integration (Week 2)

### 2.1 OpenClaw Skill `[ ]`
- Clawtner skill for OpenClaw agents
- Push drafts from heartbeat/cron
- Read approval status

### 2.2 iMessage Webhook Handler `[ ]`
- Lightweight Express server on Mac
- Receives approved messages via webhook
- Sends via `imsg` CLI
- Reports delivery status back

## Phase 3: Open Source Prep (Week 3)

### 3.1 Documentation `[ ]`
- "Bring your own agent" guide
- Self-hosting guide (Cloudflare + Docker)
- Example agent configs

### 3.2 Delivery Plugins `[ ]`
- Twilio SMS plugin (example)
- Telegram bot plugin (example)
- WhatsApp via wacli (example)

### 3.3 Polish `[ ]`
- Landing page
- Demo mode (fake data)
- GitHub Actions CI

## Decisions
- Cloudflare over Vercel: already have infra, D1 is free, Workers are fast
- PWA over native app: no app store approval, instant updates, works everywhere
- Webhook-based delivery: keeps Clawtner credential-free, users own their sending
- PIN auth over passwords: it's a phone app, keep it simple

## Open Questions
- [ ] Custom domain? clawtner.dev? clawtner.app?
- [ ] Do we want push notifications for new drafts pending approval?
- [ ] Rate limiting per API key?
- [ ] Multi-user from day one or add later?
