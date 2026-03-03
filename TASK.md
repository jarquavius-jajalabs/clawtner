# Clawtner Build Task

You're building Clawtner — an agent-agnostic relationship message queue with human-in-the-loop approval. It runs on Cloudflare Workers + Pages + D1, with a React PWA frontend.

## Current State

- Vite + React + TypeScript scaffold exists
- D1 schema in `migrations/001_init.sql` (contacts, drafts, channels, api_keys, history, cycles, cycle_logs)
- Frontend is demo-only (localStorage, no real API calls)
- wrangler.toml configured but D1 database_id is empty (needs creation)
- No backend API routes exist yet

## What to Build (Full Scope)

### 1. Database Setup

Create D1 database and update wrangler.toml:
```bash
npx wrangler d1 create clawtner-db
# Copy the database_id into wrangler.toml
npx wrangler d1 execute clawtner-db --file=./migrations/001_init.sql --local
```

### 2. New Migration: Flowers & Gifts

Create `migrations/002_flowers.sql`:

```sql
-- Contact addresses (needed for flower delivery)
ALTER TABLE contacts ADD COLUMN address_line1 TEXT;
ALTER TABLE contacts ADD COLUMN address_line2 TEXT;
ALTER TABLE contacts ADD COLUMN city TEXT;
ALTER TABLE contacts ADD COLUMN state TEXT;
ALTER TABLE contacts ADD COLUMN zip TEXT;
ALTER TABLE contacts ADD COLUMN country TEXT DEFAULT 'US';
ALTER TABLE contacts ADD COLUMN gift_preferences TEXT; -- JSON: favorite flowers, allergies, notes

-- Gift/flower orders
CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  provider TEXT DEFAULT 'floristone', -- floristone, manual
  provider_order_id TEXT,
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  product_price REAL,
  delivery_date TEXT,
  message_card TEXT, -- message on the card
  recipient_name TEXT,
  recipient_address TEXT, -- JSON
  payment_token TEXT, -- Stripe token (never store raw card)
  status TEXT DEFAULT 'pending', -- pending | approved | ordered | delivered | failed
  error TEXT,
  metadata TEXT, -- JSON
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_gifts_contact ON gifts(contact_id);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
```

Run both migrations locally.

### 3. Backend API Routes

Create `functions/api/` directory with Cloudflare Pages Functions. Each file is a route.

**Auth middleware** (`functions/api/_middleware.ts`):
- Check `Authorization: Bearer <key>` header
- Hash the key with SHA-256, look up in api_keys table
- For PWA auth: support PIN-based session tokens too
- Pass `env.CLAWTNER_DB` (D1 binding) through

**Routes to build:**

```
functions/api/
  _middleware.ts          -- auth
  drafts/
    index.ts             -- GET (list), POST (create)
    [id].ts              -- GET, PATCH (approve/reject/edit), DELETE
  contacts/
    index.ts             -- GET (list), POST (create)
    [id].ts              -- GET, PATCH, DELETE
  channels/
    index.ts             -- GET, POST
    [id].ts              -- GET, PATCH, DELETE
  history/
    index.ts             -- GET (all history)
    [contact_id].ts      -- GET (per contact)
  gifts/
    products.ts          -- GET — proxy to Florist One API (get products)
    delivery-dates.ts    -- GET — proxy to Florist One API (get delivery dates)
    index.ts             -- GET (list orders), POST (create gift draft)
    [id].ts              -- GET, PATCH (approve/order), DELETE
  auth/
    pin.ts               -- POST — verify PIN, return session token
    keys.ts              -- POST — create API key (PIN-authed only)
```

**Draft creation (POST /api/drafts):**
```json
{
  "contact_id": "darcie",
  "message": "Thinking about you",
  "category": "love_note",
  "suggested_time": 1709500000,
  "metadata": { "agent": "openclaw" }
}
```

**Gift creation (POST /api/gifts):**
```json
{
  "contact_id": "darcie",
  "product_id": "roses-dozen-red",
  "delivery_date": "2026-03-14",
  "message_card": "Love you always",
  "metadata": { "occasion": "valentines" }
}
```

**On gift approval (PATCH /api/gifts/:id with status=approved):**
- Requires `payment_token` in body (Stripe token from frontend)
- Calls Florist One Place Order API
- Updates gift status to "ordered" or "failed"

### 4. Florist One API Integration

Create `functions/lib/floristone.ts`:

Base URL: `https://www.floristone.com/api/rest/`

Key endpoints:
- `GetProducts` — list available flower arrangements
- `GetDeliveryDates` — valid delivery dates
- `CreateCart` / `AddToCart` — manage cart
- `PlaceOrder` — submit order with payment token

The API key will be stored as a Cloudflare secret: `FLORISTONE_API_KEY`
For now, stub the API calls with realistic mock data so the UI can be built. Mark stubs clearly with `// TODO: Replace with real Florist One API call`.

### 5. Webhook Delivery System

Create `functions/lib/webhooks.ts`:
- On draft approval: fire webhook to matched channel
- POST to channel URL with: `{ contact, message, draft, metadata }`
- Retry 3x with exponential backoff (1s, 5s, 25s)
- Log results to history table
- For gift approvals: place order first, then fire webhook with order confirmation

### 6. Frontend PWA Rebuild

Rebuild `src/` to work with the real API instead of localStorage.

**Tabs:**
1. **Queue** — pending drafts AND pending gifts, swipeable cards
   - Swipe right = approve, swipe left = reject
   - Tap to edit message before approving
   - Gift cards show: product image, price, delivery date, card message
   - Gift approval opens payment sheet (Stripe Elements)
2. **Contacts** — manage contacts with addresses and gift preferences
3. **Flowers** — browse Florist One catalog, pick a contact, compose card message, pick delivery date
4. **History** — sent messages and gift orders with status
5. **Settings** — PIN setup, API keys, channel webhooks

**Design:**
- Mobile-first PWA (installable)
- Dark theme (charcoal bg, warm accents)
- Smooth swipe gestures for approval queue
- Card-based layout
- Add PWA manifest + service worker for offline/install

**Payment (Stripe Elements):**
- Load Stripe.js
- Mount card element when approving a gift
- Create payment token, send with approval PATCH
- For now, use Stripe test mode. The key will be `STRIPE_PUBLISHABLE_KEY` env var.
- Stub with `pk_test_placeholder` for now

### 7. Environment Variables Needed

In wrangler.toml or Cloudflare dashboard:
- `CLAWTNER_DB` — D1 binding (already in wrangler.toml)
- `FLORISTONE_API_KEY` — Florist One API key (secret)
- `STRIPE_SECRET_KEY` — Stripe secret key (secret)
- `STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (var)
- `AUTH_PIN_HASH` — SHA-256 of the user's PIN (secret)
- `JWT_SECRET` — for session tokens (secret)

### 8. Testing

After building:
```bash
npm run dev  # Should start Vite + Wrangler dev server
```

Make sure:
- API routes respond correctly (test with curl)
- Frontend loads and shows the queue
- Can create a contact via API
- Can push a draft via API
- Draft appears in the queue
- Can approve/reject from the UI
- Flower catalog loads (even if mocked)
- Gift draft appears with product image

## Tech Constraints

- Cloudflare Workers (not Node.js — no `fs`, no `process`, limited APIs)
- D1 for database (SQLite-compatible, accessed via `env.CLAWTNER_DB`)
- Pages Functions for API routes (file-based routing in `functions/`)
- React 19 + Vite 7 + TypeScript
- Keep dependencies minimal — no heavy UI frameworks, vanilla CSS or lightweight solution

## File Structure Target

```
clawtner/
  functions/
    api/
      _middleware.ts
      drafts/
        index.ts
        [id].ts
      contacts/
        index.ts
        [id].ts
      channels/
        index.ts
        [id].ts
      history/
        index.ts
        [contact_id].ts
      gifts/
        products.ts
        delivery-dates.ts
        index.ts
        [id].ts
      auth/
        pin.ts
        keys.ts
    lib/
      floristone.ts
      webhooks.ts
      auth.ts
      db.ts
  migrations/
    001_init.sql
    002_flowers.sql
  public/
    manifest.json
    sw.js
  src/
    App.tsx
    main.tsx
    components/
      Queue.tsx
      Contacts.tsx
      Flowers.tsx
      History.tsx
      Settings.tsx
      SwipeCard.tsx
      GiftCard.tsx
      PaymentSheet.tsx
    hooks/
      useApi.ts
      useSwipe.ts
    lib/
      api.ts
      types.ts
    styles/
      global.css
      queue.css
      contacts.css
      flowers.css
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  wrangler.toml
```

## Important

- Do NOT use `npm install` for anything unless you actually need a new package
- Existing deps: react, react-dom, vite, @vitejs/plugin-react, wrangler, typescript
- You may add: @stripe/stripe-js (for payment elements)
- Keep it clean, typed, and working
- Commit when done with a descriptive message

When completely finished, run this command to notify me:
openclaw system event --text "Done: Clawtner full build — API routes, D1 database, flower/gift system, PWA rebuild with swipe queue and Stripe payment flow" --mode now
