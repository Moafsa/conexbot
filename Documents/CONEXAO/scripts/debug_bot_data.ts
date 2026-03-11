
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

// 1. Load .env manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key.trim()]) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

async function main() {
    console.log('Connecting to DB...');
    // 2. Initialize Prisma with Adapter
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not found in .env');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const sessionName = 'bot-0fb143fb';
        const bot = await prisma.bot.findUnique({
            where: { sessionName },
            include: { media: true }
        });

        if (!bot) {
            console.log('Bot not found for session:', sessionName);
            const allBots = await prisma.bot.findMany({ select: { name: true, sessionName: true } });
            console.log('Available bots:', allBots);
            return;
        }

        console.log('=== BOT DUMP ===');
        console.log('Name:', bot.name);
        console.log('Business Type:', bot.businessType);

        console.log('\n--- SYSTEM PROMPT (First 500 chars) ---');
        console.log(bot.systemPrompt ? bot.systemPrompt.substring(0, 500) : 'NONE');

        console.log('\n--- KNOWLEDGE BASE (First 500 chars) ---');
        console.log(bot.knowledgeBase ? bot.knowledgeBase.substring(0, 500) : 'NONE');

        console.log('\n--- SCRAPED CONTENT (First 500 chars) ---');
        console.log(bot.scrapedContent ? bot.scrapedContent.substring(0, 500) : 'NONE');

        console.log('\n--- MEDIA ---');
        bot.media.forEach(m => {
            console.log(`- [${m.type}] ${m.filename} (${m.extractedText?.length || 0} chars text)`);
        });

    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch(console.error);
