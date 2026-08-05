-- Rascunho de proposta gerado pelo raio-x
ALTER TABLE "ClientAudit" ADD COLUMN IF NOT EXISTS "proposalDraft" JSONB;

-- Proposta comercial editável pela agência, exportável em PDF
CREATE TABLE IF NOT EXISTS "ClientProposal" (
    "id"           TEXT NOT NULL,
    "clientId"     TEXT NOT NULL,
    "agencyId"     TEXT NOT NULL,
    "auditId"      TEXT,
    "title"        TEXT NOT NULL DEFAULT 'Proposta Comercial',
    "diagnosis"    JSONB NOT NULL DEFAULT '[]',
    "deliverables" JSONB NOT NULL DEFAULT '[]',
    "services"     JSONB NOT NULL DEFAULT '[]',
    "timeline"     JSONB NOT NULL DEFAULT '[]',
    "nextSteps"    JSONB NOT NULL DEFAULT '[]',
    "status"       TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientProposal_clientId_idx" ON "ClientProposal"("clientId");
CREATE INDEX IF NOT EXISTS "ClientProposal_agencyId_idx" ON "ClientProposal"("agencyId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ClientProposal_clientId_fkey'
    ) THEN
        ALTER TABLE "ClientProposal"
        ADD CONSTRAINT "ClientProposal_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ClientProposal_auditId_fkey'
    ) THEN
        ALTER TABLE "ClientProposal"
        ADD CONSTRAINT "ClientProposal_auditId_fkey"
        FOREIGN KEY ("auditId") REFERENCES "ClientAudit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
