-- Player alignment score: -100 (chaotic evil) to +100 (lawful good)
ALTER TABLE players ADD COLUMN IF NOT EXISTS alignment INTEGER NOT NULL DEFAULT 0;
