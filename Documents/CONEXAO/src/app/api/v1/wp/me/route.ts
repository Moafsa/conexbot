import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decode } from 'next-auth/jwt';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.NEXTAUTH_SECRET || '';

        // Decode token
        const decoded = await decode({
            token,
            secret
        }) as any;

        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // Get tenant with sub and bots
        const tenant = await prisma.tenant.findUnique({
            where: { id: decoded.id },
            include: {
                subscription: true,
                bots: {
                    select: { id: true, connectionStatus: true }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const hasPlan = tenant.subscription && ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE'].includes(tenant.subscription.status);
        const hasBot = tenant.bots.length > 0;
        const botConnected = tenant.bots.some(b => b.connectionStatus === 'CONNECTED');

        return NextResponse.json({
            id: tenant.id,
            name: tenant.name,
            email: tenant.email,
            hasPlan: !!hasPlan,
            subscriptionStatus: tenant.subscription?.status || 'NONE',
            hasBot,
            botConnected
        });

    } catch (error) {
        console.error('WP Me Error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
