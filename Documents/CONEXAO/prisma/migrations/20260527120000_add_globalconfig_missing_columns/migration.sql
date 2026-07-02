-- GlobalConfig columns present in schema but missing from production DB
ALTER TABLE "GlobalConfig" ADD COLUMN IF NOT EXISTS "chatwootSuperAdminToken" TEXT;
ALTER TABLE "GlobalConfig" ADD COLUMN IF NOT EXISTS "chatwootBaseUrl" TEXT;
ALTER TABLE "GlobalConfig" ADD COLUMN IF NOT EXISTS "mapboxToken" TEXT;
ALTER TABLE "GlobalConfig" ADD COLUMN IF NOT EXISTS "anthropicApiKey" TEXT;
