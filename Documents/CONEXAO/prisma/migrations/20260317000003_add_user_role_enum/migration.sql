-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable Tenant.role: drop default, convert TEXT to UserRole, set default
ALTER TABLE "Tenant" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'SUPERADMIN' THEN 'SUPERADMIN'::"UserRole"
    WHEN 'ADMIN' THEN 'ADMIN'::"UserRole"
    ELSE 'USER'::"UserRole"
  END
);
ALTER TABLE "Tenant" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";
