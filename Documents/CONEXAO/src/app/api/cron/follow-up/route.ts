import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FollowUpService } from '@/services/engine/follow-up';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(req: Request) {
    try {
        console.log('[Cron] Starting Follow-up Check...');

        // 1. Get all active bots
        const bots = await prisma.bot.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true }
        });

        console.log(`[Cron] Found ${bots.length} active bots.`);

        // 2. Process Daily AI Followups (Rules based)
        console.log('[Cron] Processing rule-based followups...');
        await FollowUpService.processDailyFollowups();

        // 3. Process stalled conversations (legacy/fallback)
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
