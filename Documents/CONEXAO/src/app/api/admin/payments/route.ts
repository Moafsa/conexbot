import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
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

        const [payments, total] = await Promise.all([
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
        prisma.payment.count({ where: whereCondition })
    ]);

    return NextResponse.json({
        data: payments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
    });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
