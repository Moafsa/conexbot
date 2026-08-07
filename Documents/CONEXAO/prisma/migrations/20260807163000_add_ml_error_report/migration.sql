-- CreateTable
CREATE TABLE "MlErrorReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "siteUrl" TEXT,
    "wooProductId" TEXT,
    "productName" TEXT,
    "mlItemId" TEXT,
    "errorMessage" TEXT NOT NULL,
    "pluginVersion" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MlErrorReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MlErrorReport_tenantId_idx" ON "MlErrorReport"("tenantId");

-- CreateIndex
CREATE INDEX "MlErrorReport_resolved_idx" ON "MlErrorReport"("resolved");
