-- CreateTable
CREATE TABLE "GlobalConfig" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "systemName" TEXT NOT NULL DEFAULT 'ConextBot',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "googleClientId" TEXT,
    "googleClientSecret" TEXT,
    "openaiApiKey" TEXT,
    "geminiApiKey" TEXT,
    "asaasApiKey" TEXT,
    "elevenLabsApiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supportEmail" TEXT,
    "supportWhatsapp" TEXT,
    "asaasWalletId" TEXT,
    "smtpFrom" TEXT,
    "smtpHost" TEXT,
    "smtpPass" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "systemBotId" TEXT,
    "logoColoredUrl" TEXT,
    "logoWhiteUrl" TEXT,
    "mercadoPagoAccessToken" TEXT,
    "stripePublishableKey" TEXT,
    "stripeSecretKey" TEXT,

    CONSTRAINT "GlobalConfig_pkey" PRIMARY KEY ("id")
);

-- Insert initial "system" config
INSERT INTO "GlobalConfig" ("id", "updatedAt") VALUES ('system', CURRENT_TIMESTAMP);
