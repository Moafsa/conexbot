
import prisma from './src/lib/prisma';

async function run() {
    try {
        const bot = await prisma.bot.findFirst({
            where: { sessionName: 'bot-757b9f7f' }
        });
        console.log('BOT CONFIGURATION:');
        console.log(JSON.stringify(bot, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
