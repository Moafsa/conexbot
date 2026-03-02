import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const bots = await prisma.bot.findMany({ select: { id: true, name: true } });
        console.log("All bots in DB:");
        console.dir(bots);
        const specificBot = await prisma.bot.findUnique({ where: { id: 'cm79k7o3t000j11h682q60t3t' } });
        console.log("\nSpecific Bot:", specificBot);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
