-- Love language on contacts
ALTER TABLE contacts ADD COLUMN love_language TEXT;
ALTER TABLE contacts ADD COLUMN love_language_secondary TEXT;

-- Convo mode toggle
ALTER TABLE contacts ADD COLUMN convo_mode INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN convo_mode_escalation TEXT DEFAULT 'emotional,decisions,money';

-- Adaptive learning: track what lands well
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  reaction TEXT,
  response_time INTEGER,
  original_message TEXT,
  edited_message TEXT,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_feedback_contact ON feedback(contact_id);

-- Learning insights (aggregated)
CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  insight_type TEXT NOT NULL,
  insight_key TEXT NOT NULL,
  score REAL DEFAULT 0,
  sample_count INTEGER DEFAULT 0,
  last_updated INTEGER DEFAULT (unixepoch()),
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_insights_contact ON insights(contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_insights_unique ON insights(contact_id, insight_type, insight_key);
