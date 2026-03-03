-- Clawtner Schema v1

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  channel TEXT DEFAULT 'webhook',
  relationship TEXT,
  tone TEXT,
  preferences TEXT,
  special_dates TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending',
  suggested_time INTEGER,
  approved_at INTEGER,
  sent_at INTEGER,
  edited_message TEXT,
  metadata TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'webhook',
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST',
  headers TEXT,
  contact_ids TEXT,
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT DEFAULT '["drafts:write"]',
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  last_used INTEGER
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  message TEXT NOT NULL,
  channel_id TEXT REFERENCES channels(id),
  status TEXT DEFAULT 'sent',
  delivered_at INTEGER,
  error TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Period / cycle tracking
CREATE TABLE IF NOT EXISTS cycles (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  cycle_start DATE NOT NULL,        -- first day of period
  cycle_end DATE,                    -- first day of next period (filled retroactively)
  period_length INTEGER DEFAULT 5,   -- days of bleeding
  cycle_length INTEGER DEFAULT 28,   -- total cycle length
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS cycle_logs (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  date DATE NOT NULL,
  flow TEXT,                          -- none | light | medium | heavy
  mood TEXT,                          -- happy | neutral | irritable | sad | anxious
  energy TEXT,                        -- low | medium | high
  symptoms TEXT,                      -- JSON array: cramps, headache, bloating, cravings, etc
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_contact ON drafts(contact_id);
CREATE INDEX IF NOT EXISTS idx_history_contact ON history(contact_id);
CREATE INDEX IF NOT EXISTS idx_cycles_contact ON cycles(contact_id);
CREATE INDEX IF NOT EXISTS idx_cycle_logs_date ON cycle_logs(contact_id, date);
