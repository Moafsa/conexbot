export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const search = searchParams.get('search') || '';
        const limit = 20;
        const skip = (page - 1) * limit;

        const whereCondition: any = {};
        if (search) {
            whereCondition.tenant = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        const [payments, total, stats] = await Promise.all([
            prisma.payment.findMany({
                where: whereCondition,
                include: {
                    tenant: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.payment.count({ where: whereCondition }),
            prisma.payment.groupBy({
                by: ['type'],
                where: { status: { in: ['RECEIVED', 'CONFIRMED', 'PAID'] } },
                _sum: { amount: true }
            })
        ]);

        const totalRevenue = stats.reduce((acc, curr) => acc + (curr._sum.amount || 0), 0);

        return NextResponse.json({
            data: payments,
            total,
            stats: stats.map(s => ({ type: s.type, total: s._sum.amount })),
            totalRevenue,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

