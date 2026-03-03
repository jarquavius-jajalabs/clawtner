# Clawtner

An agent-agnostic relationship message queue with human-in-the-loop approval. Your AI writes the drafts. You decide what sends.

## What It Does

Clawtner sits between your AI agent and the people you care about. Any agent pushes message drafts to Clawtner's API. You review them on your phone. Approve, edit, or skip. Nothing sends without you.

## Why

AI can write great messages. But you should still be the one deciding what your wife, mom, or friend actually receives. Clawtner is the trust layer.

## How It Works

```
[Your AI Agent] → POST /api/drafts → [Clawtner Queue] → [You approve on phone] → [Webhook fires] → [Message delivers]
```

- **Agent-agnostic** — OpenClaw, Claude, GPT, local LLM, a cron job. Anything that can POST JSON.
- **Human-in-the-loop** — nothing sends without your approval
- **Multi-contact** — wife, mom, dad, kids, friends. Each has their own queue and profile.
- **Pluggable delivery** — iMessage, SMS, WhatsApp, Telegram, email. Bring your own via webhooks.
- **Self-hostable** — your data, your server, your love notes

## Quick Start

```bash
# Clone
git clone https://github.com/jajalabs/clawtner.git
cd clawtner

# Install
npm install

# Dev
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## API

### Push a draft (from your agent)

```bash
curl -X POST https://your-clawtner.pages.dev/api/drafts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": "darcie",
    "message": "Hey babe, thinking about you today",
    "category": "love_note",
    "suggested_time": "2026-03-01T14:00:00-08:00",
    "metadata": {
      "agent": "openclaw",
      "context": "daily afternoon check-in"
    }
  }'
```

### Review pending drafts

```bash
curl https://your-clawtner.pages.dev/api/drafts?status=pending \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Approve a draft

```bash
curl -X PATCH https://your-clawtner.pages.dev/api/drafts/DRAFT_ID \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  AI Agent    │────▶│    Clawtner API   │────▶│  Delivery   │
│  (any LLM)  │     │  (Workers + D1)   │     │  Webhooks   │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Mobile PWA      │
                    │   Approval Queue  │
                    │   (swipe UI)      │
                    └──────────────────┘
```

### Tech Stack

- **Frontend:** React PWA (installable on iOS/Android)
- **Backend:** Cloudflare Workers + D1
- **Auth:** API keys (agents) + passkey/PIN (phone UI)
- **Delivery:** Webhook-based — you wire up your own sending

## Concepts

### Contacts

People you message. Each contact has:
- Name, phone/handle, preferred channel
- Relationship type (partner, parent, friend)
- Tone profile (how you talk to them)
- Special dates (birthday, anniversary)
- Preferences (meal planning? daily check-ins? weekly summaries?)

### Categories

Message types that help organize and filter:
- `love_note` — sweet messages
- `check_in` — how's your day
- `meal_plan` — weekly meal plans + grocery lists
- `reminder` — appointments, events, to-dos
- `special` — birthdays, anniversaries, milestones
- Custom categories welcome

### Delivery Channels

Webhooks that fire when you approve a draft:

```json
{
  "name": "imessage-mac",
  "type": "webhook",
  "url": "http://localhost:3000/hooks/imessage",
  "method": "POST",
  "contacts": ["darcie", "mom"]
}
```

The webhook receives the approved message + contact info. Your handler does the actual sending. Clawtner never touches messaging credentials.

## Roadmap

- [x] Project scaffold
- [ ] D1 schema + migrations
- [ ] Drafts API (CRUD)
- [ ] Contacts API
- [ ] Delivery webhook system
- [ ] Mobile PWA with swipe approval
- [ ] OpenClaw integration guide
- [ ] Twilio SMS plugin
- [ ] WhatsApp plugin
- [ ] Docker self-host option
- [ ] Multi-user support

## License

MIT

## Built by

[jajaLabs](https://github.com/jajalabs) — AI tools for humans who give a damn.
