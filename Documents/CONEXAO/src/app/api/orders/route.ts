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

    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const botId  = searchParams.get('botId')  || '';
    const from   = searchParams.get('from')   || '';
    const to     = searchParams.get('to')     || '';

    const where: any = { bot: { tenantId } };

    if (status) where.status = status;
    if (botId)  where.botId  = botId;
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to)   where.createdAt.lte = new Date(to + 'T23:59:59');
    }
    if (search) {
        where.OR = [
            { contact: { name:  { contains: search, mode: 'insensitive' } } },
            { contact: { phone: { contains: search } } },
            { address: { contains: search, mode: 'insensitive' } },
            { notes:   { contains: search, mode: 'insensitive' } },
        ];
    }

    const [orders, total, statusCounts] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                contact: { select: { id: true, name: true, phone: true } },
                bot:     { select: { id: true, name: true } },
                driver:  { select: { id: true, name: true, phone: true } },
                items: { include: { product: { select: { id: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.order.count({ where }),
        prisma.order.groupBy({
            by: ['status'],
            where: { bot: { tenantId }, ...(botId ? { botId } : {}) },
            _count: { _all: true },
        }),
    ]);

    return NextResponse.json({
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
        statusCounts: Object.fromEntries(statusCounts.map(s => [s.status, s._count._all])),
    });
}
