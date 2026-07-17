-- Facebook Login for Business Configuration ID used by the WhatsApp Embedded Signup popup
ALTER TABLE "GlobalConfig" ADD COLUMN IF NOT EXISTS "metaWhatsappConfigId" TEXT;
