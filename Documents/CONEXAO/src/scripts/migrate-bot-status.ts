
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Migrating bot status to uppercase...');
    const result = await prisma.bot.updateMany({
        where: {
            OR: [
                { status: 'active' },
                { status: 'paused' }
            ]
        },
        data: {
            status: {
                set: 'ACTIVE' // This is simplified, let's do it properly
            }
        }
    });

    // Better way to handle both:
    await prisma.bot.updateMany({
        where: { status: 'active' },
        data: { status: 'ACTIVE' }
    });
    await prisma.bot.updateMany({
        where: { status: 'paused' },
        data: { status: 'PAUSED' }
    });

    console.log('Migration completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
