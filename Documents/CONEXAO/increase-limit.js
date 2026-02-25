
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function increaseLimit() {
    try {
        const sessionName = 'bot-2cebade3';
        console.log(`Increasing limit for session: ${sessionName}`);

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

        if (bot.tenant.usageCounter) {
            console.log(`Current Usage: ${bot.tenant.usageCounter.messagesUsed} / ${bot.tenant.usageCounter.messagesLimit}`);

            const updated = await prisma.usageCounter.update({
                where: { id: bot.tenant.usageCounter.id },
                data: { messagesLimit: 10000 } // Set to 10k
            });

            console.log(`New Limit: ${updated.messagesLimit}`);
            console.log('Limit increased successfully.');
        } else {
            console.log('No Usage Counter found. Creating one...');
            await prisma.usageCounter.create({
                data: {
                    tenantId: bot.tenantId,
                    messagesUsed: 0,
                    messagesLimit: 10000
                }
            });
            console.log('Usage counter created with limit 10000.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

increaseLimit();
