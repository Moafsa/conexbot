
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const botId = '14161d0c-f121-4374-9297-d18ecbc2caf5';
    const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { businessType: true, name: true }
    });

    console.log('Bot Name:', bot?.name);
    console.log('Business Type:', bot?.businessType);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
