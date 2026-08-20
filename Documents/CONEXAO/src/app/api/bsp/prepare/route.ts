export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/bsp/prepare
 *
 * Returns the botId to use for a BSP connection flow.
 * If the tenant has no BSP container bot, creates one automatically.
 * The caller should redirect to /dashboard/connect?botId=<id>
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = (session.user as any).id;

    // Each WABA connection gets its own container bot.
    // Count existing BSP bots to generate a name like "Número 1", "Número 2", etc.
    const existingCount = await prisma.bot.count({ where: { tenantId, businessType: 'BSP' } });
    const label = existingCount === 0 ? 'Meu Número WhatsApp' : `Número WhatsApp ${existingCount + 1}`;

    const bot = await prisma.bot.create({
        data: {
            name: label,
            businessType: 'BSP',
            tenantId,
            status: 'active',
            aiAgentStatus: 'DISABLED',
            modules: [],
            paymentMethods: [],
        }
    });

    return NextResponse.json({ botId: bot.id, name: bot.name, created: true });
}
