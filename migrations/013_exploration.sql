-- Per-player exploration state
ALTER TABLE players ADD COLUMN IF NOT EXISTS ruins_visited  TEXT NOT NULL DEFAULT '[]';
ALTER TABLE players ADD COLUMN IF NOT EXISTS dungeon_clears TEXT NOT NULL DEFAULT '[]';
