
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Migrating bot status to uppercase...');
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

main().catch(console.error).finally(() => prisma.$disconnect());
