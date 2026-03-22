-- Add perk system columns to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS perks        TEXT    NOT NULL DEFAULT '[]';
ALTER TABLE players ADD COLUMN IF NOT EXISTS perk_points  INTEGER NOT NULL DEFAULT 0;
