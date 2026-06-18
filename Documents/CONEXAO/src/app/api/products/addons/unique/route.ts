export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const botId = searchParams.get('botId');

        if (!botId) return NextResponse.json({ error: 'botId is required' }, { status: 400 });

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { 
                id: botId, 
                OR: [
                    { tenantId: (session.user as any).id },
                    { tenant: { managedBy: { tenantId: (session.user as any).id } } }
                ] 
            }
        });

        if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

        // Get all addons for this bot
        const addons = await prisma.productAddon.findMany({
            where: { group: { botId }, active: true },
            orderBy: { name: 'asc' },
            select: { name: true, price: true }
        });

        // Get unique ones, keeping the latest price
        const uniqueAddonsMap = new Map();
        for (const addon of addons) {
            uniqueAddonsMap.set(addon.name.toLowerCase().trim(), addon);
        }

        const uniqueAddons = Array.from(uniqueAddonsMap.values());

        return NextResponse.json(uniqueAddons);
    } catch (error) {
        console.error('[API UniqueAddons GET] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
