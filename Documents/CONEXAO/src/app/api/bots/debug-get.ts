import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;

        console.log('[DEBUG] Fetching bots for tenant:', tenantId);

        const bots = await prisma.bot.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { conversations: true } },
            },
        });

        console.log('[DEBUG] Found bots:', bots.length, bots.map(b => ({ id: b.id, name: b.name })));

        return NextResponse.json(bots);
    } catch (error) {
        console.error('Error fetching bots:', error);
        return NextResponse.json({ error: 'Falha ao buscar agentes' }, { status: 500 });
    }
}
