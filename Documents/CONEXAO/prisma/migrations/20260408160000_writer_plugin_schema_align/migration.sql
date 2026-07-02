-- Align DB with schema: AI Writer / licensing (missing from prior deploys)

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('PRIMARY', 'WRITER_PLUGIN');

-- AlterTable Plan
ALTER TABLE "Plan" ADD COLUMN "postLimit" INTEGER DEFAULT 0;
ALTER TABLE "Plan" ADD COLUMN "wordLimit" INTEGER DEFAULT 0;
ALTER TABLE "Plan" ADD COLUMN "type" "SubscriptionType" NOT NULL DEFAULT 'PRIMARY';

-- AlterTable Subscription
ALTER TABLE "Subscription" ADD COLUMN "type" "SubscriptionType" NOT NULL DEFAULT 'PRIMARY';
ALTER TABLE "Subscription" ADD COLUMN "writerPostsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subscription" ADD COLUMN "writerWordsUsed" INTEGER NOT NULL DEFAULT 0;

-- Unique on tenantId only was created as a unique index (not a named constraint)
DROP INDEX IF EXISTS "Subscription_tenantId_key";

CREATE UNIQUE INDEX "Subscription_tenantId_type_key" ON "Subscription"("tenantId", "type");

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN "type" "SubscriptionType" NOT NULL DEFAULT 'PRIMARY';

-- CreateTable LicenseKey
CREATE TABLE "LicenseKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "siteUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LicenseKey_key_key" ON "LicenseKey"("key");

ALTER TABLE "LicenseKey" ADD CONSTRAINT "LicenseKey_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
