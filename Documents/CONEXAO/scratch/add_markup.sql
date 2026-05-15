ALTER TABLE "AgencyPricing" ADD COLUMN IF NOT EXISTS "markupPercent" FLOAT NOT NULL DEFAULT 0;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'AgencyPricing';
