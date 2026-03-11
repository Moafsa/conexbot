import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const search = url.searchParams.get('search') || '';
        const limit = 20;

        const whereCondition: any = {};
        if (search) {
            whereCondition.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.tenant.findMany({
                where: whereCondition,
                include: {
                    subscription: {
                        include: {
                            plan: true
                        }
                    },
                    _count: {
                        select: { bots: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.tenant.count({ where: whereCondition })
        ]);

        return NextResponse.json({
            data: users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, name, password, role } = body;

        if (!password) {
            return new NextResponse('Senha é obrigatória', { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.tenant.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: role || 'USER'
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
