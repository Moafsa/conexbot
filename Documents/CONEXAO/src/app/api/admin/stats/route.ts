import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const [totalTenants, totalBots, totalMessages, activeSubscriptions, recentTenants] = await Promise.all([
            prisma.tenant.count(),
            prisma.bot.count(),
            prisma.message.count(),
            prisma.subscription.count({ where: { status: 'active' } }),
            prisma.tenant.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    _count: { select: { bots: true } },
                },
            }),
        ]);

        return NextResponse.json({
            totalTenants,
            totalBots,
            totalMessages,
            activeSubscriptions,
            recentTenants,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
