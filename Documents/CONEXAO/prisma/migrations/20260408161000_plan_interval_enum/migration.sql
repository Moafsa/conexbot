-- Align Plan.interval with Prisma enum PlanInterval

CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY','YEARLY','QUARTERLY','SEMIANNUAL');

ALTER TABLE "Plan" ALTER COLUMN interval DROP DEFAULT;
ALTER TABLE "Plan" ALTER COLUMN interval TYPE "PlanInterval" USING interval::"PlanInterval";
ALTER TABLE "Plan" ALTER COLUMN interval SET DEFAULT 'MONTHLY'::"PlanInterval";
