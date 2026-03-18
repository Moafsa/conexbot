-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "botLimit" INTEGER NOT NULL DEFAULT 1,
    "messageLimit" INTEGER NOT NULL DEFAULT 5000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platformSplitType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "platformSplitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceQuarterly" DOUBLE PRECISION,
    "priceSemiannual" DOUBLE PRECISION,
    "priceYearly" DOUBLE PRECISION,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB DEFAULT '[]',

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- AlterTable Subscription: add planId, then drop old "plan" column
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "planId" TEXT;
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "plan";
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
