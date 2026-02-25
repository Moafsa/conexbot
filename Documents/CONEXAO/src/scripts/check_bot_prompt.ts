
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const botId = '14161d0c-f121-4374-9297-d18ecbc2caf5'; // From logs
    const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { systemPrompt: true, name: true }
    });

    console.log('Bot Name:', bot?.name);
    console.log('Current System Prompt:');
    console.log('---------------------------------------------------');
    console.log(bot?.systemPrompt);
    console.log('---------------------------------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
