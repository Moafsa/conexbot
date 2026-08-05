-- Histórico persistido de gasto/impressões/cliques por campanha (Meta/Google Ads),
-- capturado diariamente via cron. Necessário porque as APIs de insights só
-- devolvem uma janela rolante (ex: últimos 30 dias).
CREATE TABLE IF NOT EXISTS "AdSpendSnapshot" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "campaignId"   TEXT NOT NULL,
    "campaignName" TEXT,
    "platform"     TEXT NOT NULL,
    "date"         TIMESTAMP(3) NOT NULL,
    "spend"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions"  INTEGER NOT NULL DEFAULT 0,
    "clicks"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdSpendSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdSpendSnapshot_tenantId_campaignId_platform_date_key"
    ON "AdSpendSnapshot"("tenantId", "campaignId", "platform", "date");

CREATE INDEX IF NOT EXISTS "AdSpendSnapshot_tenantId_date_idx"
    ON "AdSpendSnapshot"("tenantId", "date");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'AdSpendSnapshot_tenantId_fkey'
    ) THEN
        ALTER TABLE "AdSpendSnapshot"
        ADD CONSTRAINT "AdSpendSnapshot_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
