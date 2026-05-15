
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contacts = await prisma.contact.findMany();
    const bots = await prisma.bot.findMany();
    console.log('BOTS:', JSON.stringify(bots, null, 2));
    console.log('CONTACTS:', JSON.stringify(contacts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
