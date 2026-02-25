import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FollowUpService } from '@/services/engine/follow-up';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(req: Request) {
    try {
        console.log('[Cron] Starting Follow-up Check...');

        // 1. Get all active bots
        const bots = await prisma.bot.findMany({
            where: { status: 'active' },
            select: { id: true, name: true }
        });

        console.log(`[Cron] Found ${bots.length} active bots.`);

        // 2. Process each bot
        const results = [];
        for (const bot of bots) {
            try {
                await FollowUpService.processStalledConversations(bot.id);
                results.push({ bot: bot.name, status: 'checked' });
            } catch (e) {
                console.error(`[Cron] Error processing bot ${bot.name}:`, e);
                results.push({ bot: bot.name, status: 'error', error: String(e) });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date(),
            results
        });

    } catch (error) {
        console.error('[Cron] Fatal Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
