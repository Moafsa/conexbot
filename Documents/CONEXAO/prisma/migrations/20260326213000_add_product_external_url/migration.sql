-- Schema had externalUrl on Product; DB was missing the column (P2022 on queries including products).
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "externalUrl" TEXT;
