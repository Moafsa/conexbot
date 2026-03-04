require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
    const bots = await prisma.bot.findMany({
        select: { id: true, name: true, sessionName: true }
    });
    console.log(JSON.stringify(bots, null, 2));
    await prisma.$disconnect();
}

list().catch(console.error);
