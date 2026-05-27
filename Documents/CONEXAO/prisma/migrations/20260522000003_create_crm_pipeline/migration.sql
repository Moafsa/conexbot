-- Create CrmPipeline table (was in schema but never migrated to DB)
CREATE TABLE IF NOT EXISTS "CrmPipeline" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  "botId" TEXT NOT NULL,
  "allowedAgents" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmPipeline_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CrmPipeline_botId_idx" ON "CrmPipeline"("botId");

-- Create default pipeline for every existing bot that doesn't have one
INSERT INTO "CrmPipeline" (id, name, "botId", "allowedAgents", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Pipeline Principal', b.id, '{}', NOW(), NOW()
FROM "Bot" b
WHERE NOT EXISTS (SELECT 1 FROM "CrmPipeline" p WHERE p."botId" = b.id);
