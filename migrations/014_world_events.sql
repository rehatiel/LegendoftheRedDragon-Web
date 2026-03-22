-- World events: server-wide rotating modifiers
CREATE TABLE IF NOT EXISTS world_events (
  id         SERIAL PRIMARY KEY,
  type       TEXT NOT NULL,
  started_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  ends_at    BIGINT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Key-value store for persistent world state (kill counts, last dragon kill, etc.)
CREATE TABLE IF NOT EXISTS world_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Named enemies can reach a town after enough kills
ALTER TABLE named_enemies ADD COLUMN IF NOT EXISTS reached_town TEXT DEFAULT NULL;
