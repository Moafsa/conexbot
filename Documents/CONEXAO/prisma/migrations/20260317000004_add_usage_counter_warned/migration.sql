-- AlterTable UsageCounter: add warned100 and warned90
ALTER TABLE "UsageCounter" ADD COLUMN IF NOT EXISTS "warned100" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UsageCounter" ADD COLUMN IF NOT EXISTS "warned90" BOOLEAN NOT NULL DEFAULT false;
