-- Schedules (recurring message rules)
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  name TEXT,
  type TEXT NOT NULL,                -- daily | weekly | monthly | yearly | custom
  time TEXT NOT NULL,                -- "08:00" (HH:MM in user timezone)
  timezone TEXT DEFAULT 'America/Los_Angeles',
  days_of_week TEXT,                 -- JSON: [1,3,5] for Mon/Wed/Fri
  day_of_month INTEGER,
  month_day TEXT,                    -- "03-14" for Mar 14 (yearly)
  category TEXT DEFAULT 'general',
  prompt_context TEXT,               -- extra context for draft generation
  auto_approve INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  last_fired INTEGER,
  next_fire INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_schedules_next ON schedules(next_fire);
CREATE INDEX IF NOT EXISTS idx_schedules_contact ON schedules(contact_id);

-- Twilio message log
CREATE TABLE IF NOT EXISTS message_log (
  id TEXT PRIMARY KEY,
  history_id TEXT REFERENCES history(id),
  twilio_sid TEXT,
  from_number TEXT,
  to_number TEXT,
  channel TEXT DEFAULT 'sms',
  status TEXT,
  error_code TEXT,
  error_message TEXT,
  price TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_message_log_sid ON message_log(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_message_log_history ON message_log(history_id);

-- Contact profile (Soul MD - flexible key-value)
CREATE TABLE IF NOT EXISTS contact_profile (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_profile_contact ON contact_profile(contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_unique ON contact_profile(contact_id, category, key);
