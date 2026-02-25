
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectBot() {
    try {
        const sessionName = 'bot-2cebade3';
        console.log(`Inspecting bot for session: ${sessionName}`);

        const bot = await prisma.bot.findFirst({
            where: { sessionName },
            select: {
                id: true,
                name: true,
                businessType: true,
                description: true,
                systemPrompt: true,
                scrapedContent: true,
                knowledgeBase: true,
                websiteUrl: true
            }
        });

        if (!bot) {
            console.log('Bot not found.');
            return;
        }

        console.log('Bot Data:');
        console.log('Name:', bot.name);
        console.log('Business:', bot.businessType);
        console.log('Description:', bot.description);
        console.log('Website:', bot.websiteUrl);
        console.log('--- SYSTEM PROMPT (First 500 chars) ---');
        console.log(bot.systemPrompt ? bot.systemPrompt.substring(0, 500) : 'NULL');
        console.log('--- SCRAPED CONTENT (First 500 chars) ---');
        console.log(bot.scrapedContent ? bot.scrapedContent.substring(0, 500) : 'NULL');
        console.log('--- KNOWLEDGE BASE (First 500 chars) ---');
        console.log(bot.knowledgeBase ? bot.knowledgeBase.substring(0, 500) : 'NULL');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

inspectBot();
