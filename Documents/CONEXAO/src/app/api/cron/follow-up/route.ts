export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FollowUpService } from '@/services/engine/follow-up';

// Ensure it's not cached

export async function GET(req: Request) {
    try {
        console.log('[Cron] Starting Follow-up Check...');

        // 1. Get all active bots
        const bots = await prisma.bot.findMany({
            where: {
                status: {
                    in: ['ACTIVE', 'active']
                }
            },
            select: { id: true, name: true }
        });

        console.log(`[Cron] Found ${bots.length} active bots.`);

        // 2. Process Daily AI Followups (Rules based)
        console.log('[Cron] Processing rule-based followups...');
        await FollowUpService.processDailyFollowups();

        // 3. Results summary
        return NextResponse.json({
            success: true,
            timestamp: new Date(),
            message: "Follow-up rules processed."
        });

    } catch (error) {
        console.error('[Cron] Fatal Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
