
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsage() {
    try {
        const sessionName = 'bot-2cebade3';
        console.log(`Checking usage for session: ${sessionName}`);

        const bot = await prisma.bot.findFirst({
            where: { sessionName },
            include: {
                tenant: {
                    include: {
                        usageCounter: true
                    }
                }
            }
        });

        if (!bot) {
            console.log('Bot not found.');
            return;
        }

        console.log(`Bot Name: ${bot.name}`);
        console.log(`Tenant ID: ${bot.tenantId}`);

        if (bot.tenant.usageCounter) {
            console.log('Usage Counter:', bot.tenant.usageCounter);
            const { messagesUsed, messagesLimit } = bot.tenant.usageCounter;
            console.log(`Used: ${messagesUsed} / Limit: ${messagesLimit}`);
            console.log(`Limit Reached? ${messagesUsed >= messagesLimit}`);
        } else {
            console.log('No Usage Counter found for this tenant.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsage();
