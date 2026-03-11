
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const bots = await prisma.bot.findMany();
    console.log('--- BOTS CONFIGURATION ---');
    bots.forEach(b => {
        console.log(`Bot: ${b.name} (${b.id})`);
        console.log(`- System Prompt: ${b.systemPrompt ? b.systemPrompt.substring(0, 50) + '...' : 'EMPTY'}`);
        console.log(`- Chatwoot URL: ${b.chatwootUrl || 'NONE'}`);
        console.log(`- Webhook URL: ${b.webhookUrl || 'NONE'}`);
        console.log('---');
    });
    process.exit(0);
}

check();
