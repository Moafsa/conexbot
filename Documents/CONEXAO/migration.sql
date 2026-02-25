-- Add new columns to Bot
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "scrapedContent" TEXT;
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "lastScrapedAt" TIMESTAMP(3);

-- Create BotMedia table
CREATE TABLE IF NOT EXISTS "BotMedia" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "botId" TEXT NOT NULL,
  CONSTRAINT "BotMedia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BotMedia_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Contact table
CREATE TABLE IF NOT EXISTS "Contact" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "phone" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "company" TEXT,
  "role" TEXT,
  "needs" TEXT,
  "notes" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index for Contact
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_phone_tenantId_key" ON "Contact"("phone", "tenantId");
