
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting manual migration...');

  try {
    // 1. Create enums
    await prisma.$executeRawUnsafe(`CREATE TYPE "SchedulingProvider" AS ENUM ('INTERNAL', 'GOOGLE')`);
    console.log('Enum SchedulingProvider created.');
  } catch (e: any) {
    console.log('Enum SchedulingProvider might already exist:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED')`);
    console.log('Enum AppointmentStatus created.');
  } catch (e: any) {
    console.log('Enum AppointmentStatus might already exist:', e.message);
  }

  // 2. Add columns to Bot
  const botColumns = [
    { name: 'schedulingProvider', type: '"SchedulingProvider"', default: "'INTERNAL'" },
    { name: 'googleRefreshToken', type: 'TEXT' },
    { name: 'googleCalendarId', type: 'TEXT', default: "'primary'" },
    { name: 'appointmentDuration', type: 'INTEGER', default: '30' },
    { name: 'workingHours', type: 'JSONB' },
  ];

  for (const col of botColumns) {
    try {
      let sql = `ALTER TABLE "Bot" ADD COLUMN "${col.name}" ${col.type}`;
      if (col.default) sql += ` NOT NULL DEFAULT ${col.default}`;
      await prisma.$executeRawUnsafe(sql);
      console.log(`Column ${col.name} added to Bot.`);
    } catch (e: any) {
      console.log(`Column ${col.name} might already exist:`, e.message);
    }
  }

  // 3. Create Appointment table
  try {
    await prisma.$executeRawUnsafe(`
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
      )
    `);
    console.log('Table Appointment created.');
  } catch (e: any) {
    console.log('Table Appointment might already exist:', e.message);
  }

  // 4. Indexes and FKs
  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Appointment_googleEventId_key" ON "Appointment"("googleEventId")`);
    console.log('Index created.');
  } catch (e: any) {
    console.log('Index might already exist:', e.message);
  }

  const fks = [
    { name: 'Appointment_botId_fkey', sql: 'ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE' },
    { name: 'Appointment_contactId_fkey', sql: 'ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE' },
    { name: 'Appointment_tenantId_fkey', sql: 'ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE' },
  ];

  for (const fk of fks) {
    try {
      await prisma.$executeRawUnsafe(fk.sql);
      console.log(`FK ${fk.name} created.`);
    } catch (e: any) {
      console.log(`FK ${fk.name} might already exist:`, e.message);
    }
  }

  console.log('Migration finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
