-- 016_titles_hunts.sql
-- Deed-based title system, death/flee counters, and weekly hunt board

-- Player: deed title tracking
ALTER TABLE players ADD COLUMN IF NOT EXISTS earned_titles TEXT    NOT NULL DEFAULT '[]';
ALTER TABLE players ADD COLUMN IF NOT EXISTS active_title  TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS death_count   INT     NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS flee_count    INT     NOT NULL DEFAULT 0;

-- Weekly hunt board: 5 targets rotate each week
CREATE TABLE IF NOT EXISTS weekly_hunts (
  id              SERIAL PRIMARY KEY,
  week_number     INT  NOT NULL,
  rank            INT  NOT NULL DEFAULT 1,   -- 1 = easiest, 5 = hardest
  target_name     TEXT NOT NULL,
  total_kills     INT  NOT NULL DEFAULT 0,
  kill_bonus_gold INT  NOT NULL DEFAULT 500,
  kill_bonus_exp  INT  NOT NULL DEFAULT 250,
  UNIQUE(week_number, target_name)
);

-- Per-player contribution per active hunt
CREATE TABLE IF NOT EXISTS hunt_kills (
  id         SERIAL  PRIMARY KEY,
  hunt_id    INT     NOT NULL REFERENCES weekly_hunts(id) ON DELETE CASCADE,
  player_id  INT     NOT NULL REFERENCES players(id)      ON DELETE CASCADE,
  kills      INT     NOT NULL DEFAULT 0,
  UNIQUE(hunt_id, player_id)
);
