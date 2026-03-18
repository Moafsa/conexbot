-- Colunas em falta na tabela Tenant (reset password + asaasWalletId)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "asaasWalletId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "resetToken" TEXT UNIQUE;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "resetTokenExpires" TIMESTAMP(3);
