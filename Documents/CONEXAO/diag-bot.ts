
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const botId = '9ba31a1e-4c84-400d-a59e-55578d05fcd8';
    const bot = await (prisma.bot as any).findUnique({
        where: { id: botId }
    });

    if (!bot) {
        console.log('Bot not found');
        return;
    }

    console.log('--- BOT DIAGNOSTIC ---');
    console.log('ID:', bot.id);
    console.log('Name:', bot.name);
    console.log('SessionName:', bot.sessionName);
    console.log('Chatwoot URL:', bot.chatwootUrl);
    console.log('Chatwoot Account ID:', bot.chatwootAccountId);
    console.log('Chatwoot Token length:', bot.chatwootToken?.length || 0);
    console.log('Webhook URL:', bot.webhookUrl);
    console.log('Webhook Token:', bot.webhookToken);
    console.log('---');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
