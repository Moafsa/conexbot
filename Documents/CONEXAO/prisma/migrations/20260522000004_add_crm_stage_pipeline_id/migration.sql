-- Add pipelineId to CrmStage (was in schema but never migrated to DB)
ALTER TABLE "CrmStage" ADD COLUMN IF NOT EXISTS "pipelineId" TEXT REFERENCES "CrmPipeline"(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "CrmStage_pipelineId_idx" ON "CrmStage"("pipelineId");
