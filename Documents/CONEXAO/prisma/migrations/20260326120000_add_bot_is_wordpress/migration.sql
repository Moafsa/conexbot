-- Align DB with schema: Bot.isWordpress (WP sync / multi-bot features)
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "isWordpress" BOOLEAN NOT NULL DEFAULT false;
