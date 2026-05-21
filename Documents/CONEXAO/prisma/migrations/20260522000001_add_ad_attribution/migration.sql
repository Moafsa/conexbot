-- Ad attribution fields on Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "utmSource"    TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "utmMedium"    TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "utmCampaign"  TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "utmContent"   TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "utmTerm"      TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "adId"         TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "adsetId"      TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "adName"       TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "adsetName"    TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "campaignId"   TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "campaignName" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "entrySource"  TEXT;

-- Ad attribution fields on Conversation
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "utmSource"    TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "utmMedium"    TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "utmCampaign"  TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "utmContent"   TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "adId"         TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "adName"       TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "campaignId"   TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "campaignName" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "entrySource"  TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "referrer"     TEXT;
