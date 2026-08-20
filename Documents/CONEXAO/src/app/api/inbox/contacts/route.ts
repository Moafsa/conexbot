export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const tenantId = await getEffectiveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const botId = searchParams.get('botId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const PAGE_SIZE = 50;

    const bots = await prisma.bot.findMany({ where: { tenantId }, select: { id: true } });
    const botIds = bots.map(b => b.id);

    const where: any = {
        tenantId,
        ...(botId ? { botId } : { botId: { in: botIds } }),
        ...(search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        } : {}),
    };

    const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
            where,
            orderBy: { lastActive: 'desc' },
            take: PAGE_SIZE,
            skip: (page - 1) * PAGE_SIZE,
            select: {
                id: true, phone: true, name: true, email: true, company: true,
                lastActive: true, funnelStage: true, leadScore: true, tags: true,
                botId: true, notes: true, contactType: true, createdAt: true,
                bot: { select: { name: true } },
            },
        }),
        prisma.contact.count({ where }),
    ]);

    return NextResponse.json({ contacts, total, pages: Math.ceil(total / PAGE_SIZE) });
}
