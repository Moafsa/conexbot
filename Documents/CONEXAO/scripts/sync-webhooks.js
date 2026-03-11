const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const prisma = new PrismaClient();

const UZAPI_URL = process.env.UZAPI_URL || 'http://localhost:21465';

async function sync() {
    console.log('--- Syncing Webhooks (Portable JS) ---');

    // Using any to skip type checks if they fail in this env
    const bots = await prisma.bot.findMany({});

    const baseUrl = process.env.INTERNAL_WEBHOOK_URL || 'http://host.docker.internal:3001';
    const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;

    console.log(`Target Webhook: ${webhookUrl}`);

    for (const bot of bots) {
        if (bot.sessionName) {
            console.log(`Setting webhook for bot: ${bot.name} (Session: ${bot.sessionName})`);

            try {
                const res = await fetch(`${UZAPI_URL}/webhook`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': bot.sessionName,
                    },
                    body: JSON.stringify({
                        webhookurl: webhookUrl,
                    }),
                });
                console.log(`Result: ${res.ok ? 'SUCCESS' : 'FAILED (' + res.status + ')'}`);
            } catch (e) {
                console.error(`Error for bot ${bot.name}:`, e.message);
            }
        }
    }

    await prisma.$disconnect();
    console.log('--- Sync Complete ---');
}

sync().catch(console.error);
