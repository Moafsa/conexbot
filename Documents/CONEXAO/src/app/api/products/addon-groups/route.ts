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

        const groups = await prisma.productAddonGroup.findMany({
            where: { botId },
            include: {
                addons: true,
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error('[API AddonGroups GET] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
