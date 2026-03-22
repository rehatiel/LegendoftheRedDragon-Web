-- Named enemies: persistent world creatures that level up when they kill players

CREATE TABLE IF NOT EXISTS named_enemies (
  id              SERIAL PRIMARY KEY,
  template_name   TEXT    NOT NULL,
  given_name      TEXT    NOT NULL,
  level           INTEGER NOT NULL,
  template_index  INTEGER NOT NULL,
  strength        INTEGER NOT NULL,
  hp              INTEGER NOT NULL,
  gold            INTEGER NOT NULL,
  exp             INTEGER NOT NULL,
  kills           INTEGER NOT NULL DEFAULT 0,
  title           TEXT    NOT NULL DEFAULT '',
  defeated        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMP
);

ALTER TABLE players ADD COLUMN IF NOT EXISTS nemesis_id INTEGER DEFAULT NULL;
