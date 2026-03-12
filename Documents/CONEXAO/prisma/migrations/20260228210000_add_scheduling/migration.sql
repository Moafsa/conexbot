-- Create SchedulingProvider enum
CREATE TYPE "SchedulingProvider" AS ENUM ('INTERNAL', 'GOOGLE');

-- Create AppointmentStatus enum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED');

-- Add columns to Bot
ALTER TABLE "Bot" ADD COLUMN "schedulingProvider" "SchedulingProvider" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "Bot" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "Bot" ADD COLUMN "googleCalendarId" TEXT DEFAULT 'primary';
ALTER TABLE "Bot" ADD COLUMN "appointmentDuration" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Bot" ADD COLUMN "workingHours" JSONB;

-- Create Appointment table
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "googleEventId" TEXT,
    "botId" TEXT NOT NULL,
    "contactId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- Add unique index on googleEventId
CREATE UNIQUE INDEX "Appointment_googleEventId_key" ON "Appointment"("googleEventId");

-- Add foreign keys
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
