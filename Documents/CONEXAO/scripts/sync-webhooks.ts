import { UzapiService } from './src/services/engine/uzapi.ts';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function sync() {
    console.log('--- Syncing Webhooks ---');
    const bots = await prisma.bot.findMany({
        where: { sessionName: { not: null } }
    });

    const baseUrl = process.env.INTERNAL_WEBHOOK_URL || 'http://host.docker.internal:3001';
    const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;

    console.log(`Target Webhook: ${webhookUrl}`);

    for (const bot of bots) {
        if (bot.sessionName) {
            console.log(`Setting webhook for bot: ${bot.name} (Session: ${bot.sessionName})`);
            const ok = await UzapiService.setWebhook(bot.sessionName, webhookUrl);
            console.log(`Result: ${ok ? 'SUCCESS' : 'FAILED'}`);
        }
    }

    await prisma.$disconnect();
    console.log('--- Sync Complete ---');
}

sync().catch(console.error);
