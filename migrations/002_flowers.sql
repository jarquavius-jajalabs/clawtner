-- Contact addresses for flower delivery
ALTER TABLE contacts ADD COLUMN address_line1 TEXT;
ALTER TABLE contacts ADD COLUMN address_line2 TEXT;
ALTER TABLE contacts ADD COLUMN city TEXT;
ALTER TABLE contacts ADD COLUMN state TEXT;
ALTER TABLE contacts ADD COLUMN zip TEXT;
ALTER TABLE contacts ADD COLUMN country TEXT DEFAULT 'US';
ALTER TABLE contacts ADD COLUMN gift_preferences TEXT;

-- Gift/flower orders
CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  provider TEXT DEFAULT 'floristone',
  provider_order_id TEXT,
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  product_price REAL,
  delivery_date TEXT,
  message_card TEXT,
  recipient_name TEXT,
  recipient_address TEXT,
  payment_token TEXT,
  status TEXT DEFAULT 'pending',
  error TEXT,
  metadata TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_gifts_contact ON gifts(contact_id);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
