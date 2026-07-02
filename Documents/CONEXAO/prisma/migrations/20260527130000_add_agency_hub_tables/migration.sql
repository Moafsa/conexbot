-- Agency Intelligence Hub tables (in schema but never migrated)

CREATE TABLE IF NOT EXISTS "ClientAudit" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "report" JSONB NOT NULL,
    "missions" JSONB NOT NULL DEFAULT '[]',
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientAudit_clientId_idx" ON "ClientAudit"("clientId");
CREATE INDEX IF NOT EXISTS "ClientAudit_agencyId_idx" ON "ClientAudit"("agencyId");

ALTER TABLE "ClientAudit" DROP CONSTRAINT IF EXISTS "ClientAudit_clientId_fkey";
ALTER TABLE "ClientAudit" ADD CONSTRAINT "ClientAudit_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ClientTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "squadId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientTask_clientId_idx" ON "ClientTask"("clientId");
CREATE INDEX IF NOT EXISTS "ClientTask_agencyId_idx" ON "ClientTask"("agencyId");

ALTER TABLE "ClientTask" DROP CONSTRAINT IF EXISTS "ClientTask_clientId_fkey";
ALTER TABLE "ClientTask" ADD CONSTRAINT "ClientTask_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AgentTemplate" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "squadName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🤖',
    "systemPrompt" TEXT NOT NULL,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "llmProvider" TEXT NOT NULL DEFAULT 'anthropic',
    "llmModel" TEXT NOT NULL DEFAULT 'claude-sonnet-4-5',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "agencyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AgentTemplate_squadId_idx" ON "AgentTemplate"("squadId");
CREATE INDEX IF NOT EXISTS "AgentTemplate_agencyId_idx" ON "AgentTemplate"("agencyId");
