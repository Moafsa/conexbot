
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const contacts = await prisma.contact.findMany({
        select: {
            id: true,
            phone: true,
            lastActive: true,
            updatedAt: true,
            botId: true
        }
    });
    console.log(JSON.stringify(contacts, null, 2));
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
