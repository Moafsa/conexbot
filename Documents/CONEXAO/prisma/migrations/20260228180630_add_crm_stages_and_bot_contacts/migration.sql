/*
  Warnings:

  - The `funnelStage` column on the `Contact` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[phone,botId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Contact_phone_tenantId_key";

-- AlterTable
ALTER TABLE "Bot" ADD COLUMN     "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
ADD COLUMN     "aiProvider" TEXT NOT NULL DEFAULT 'openai',
ADD COLUMN     "chatwootAccountId" TEXT,
ADD COLUMN     "chatwootToken" TEXT,
ADD COLUMN     "chatwootUrl" TEXT,
ADD COLUMN     "connectionStatus" TEXT NOT NULL DEFAULT 'DISCONNECTED',
ADD COLUMN     "webhookToken" TEXT,
ADD COLUMN     "webhookUrl" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "botId" TEXT,
ADD COLUMN     "lastAiInsight" TEXT,
ADD COLUMN     "leadScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentiment" TEXT,
ADD COLUMN     "stageId" TEXT,
DROP COLUMN "funnelStage",
ADD COLUMN     "funnelStage" TEXT NOT NULL DEFAULT 'LEAD';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "botLimit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "geminiApiKey" TEXT,
ADD COLUMN     "openaiApiKey" TEXT,
ADD COLUMN     "openrouterApiKey" TEXT;

-- CreateTable
CREATE TABLE "CrmStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "botId" TEXT NOT NULL,

    CONSTRAINT "CrmStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmStage_botId_name_key" ON "CrmStage"("botId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_phone_botId_key" ON "Contact"("phone", "botId");

-- AddForeignKey
ALTER TABLE "CrmStage" ADD CONSTRAINT "CrmStage_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CrmStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
