-- Migration: Add intelligent bot fields
-- Run inside postgres container: docker exec -i conext-postgres psql -U postgres -d postgres -f migration.sql

-- Add fields to Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "asaasApiKey" TEXT;

-- Add fields to Bot  
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "productsServices" TEXT;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "enablePayments" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "fallbackContact" TEXT;

-- Add fields to BotMedia
ALTER TABLE "BotMedia" ADD COLUMN IF NOT EXISTS "extractedText" TEXT;
ALTER TABLE "BotMedia" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3);
