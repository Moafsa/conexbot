export const dynamic = 'force-dynamic';
/**
 * GET /api/marketing/leads-feed?botId=xxx&page=0
 *
 * Returns recent lead conversations for the Maestro / Traffic Supervisor.
 * Lets supervisors read actual conversations before deciding on campaign strategy.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MarketingIAService } from '@/services/marketing/marketing-ia-service';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const botId   = searchParams.get('botId');
    const page    = parseInt(searchParams.get('page') || '0', 10);

    if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });

    // Verify the bot belongs to this tenant (or their client via agency)
    const tenantId = session.user.id;
    const bot = await prisma.bot.findFirst({
        where: {
            id: botId,
            OR: [
                { tenantId },
                // Agency can see their clients' bots
                { tenant: { agencyId: { not: null }, agency: { tenantId } } },
            ],
        },
        select: { id: true, name: true },
    });

    if (!bot) return NextResponse.json({ error: 'Bot not found or access denied' }, { status: 404 });

    const feed = await MarketingIAService.getLeadConversationFeed(botId, page, 20);

    return NextResponse.json({
        botId,
        botName: bot.name,
        page,
        conversations: feed,
    });
}
