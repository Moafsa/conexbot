import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const search = url.searchParams.get('search') || '';
        const limit = 10;

        const whereCondition: any = {
            bot: { tenantId }
        };

        if (search) {
            whereCondition.OR = [
                { bot: { name: { contains: search, mode: 'insensitive' } } },
                { contact: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereCondition,
                include: {
                    bot: { select: { name: true } },
                    contact: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where: whereCondition })
        ]);

        return NextResponse.json({
            data: orders.map(o => ({
                id: o.id,
                createdAt: o.createdAt,
                botName: o.bot?.name || "N/A",
                contactName: o.contact?.name || "Cliente Base",
                total: o.totalAmount,
                commission: o.commissionAmount,
                status: o.status
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        });

    } catch (error) {
        console.error('[Finance Orders API] Error:', error);
        return NextResponse.json({ error: 'Falha ao buscar as vendas' }, { status: 500 });
    }
}
