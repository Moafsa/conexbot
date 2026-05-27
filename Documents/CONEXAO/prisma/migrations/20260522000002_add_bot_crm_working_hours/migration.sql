-- Add crmWorkingHoursEnd to Bot (was in schema but missing from DB)
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "crmWorkingHoursEnd" TEXT NOT NULL DEFAULT '18:00';
