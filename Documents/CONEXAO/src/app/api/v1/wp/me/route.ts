export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWpToken } from '@/lib/wp-token';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const queryToken = searchParams.get('token');
        const authHeader = req.headers.get('authorization');
        
        const token = queryToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Decode token using our robust HMAC implementation
        const decoded = verifyWpToken(token);

        if (!decoded || !decoded.id) {
            return NextResponse.json({ 
                error: 'Token inválido', 
                details: 'A assinatura do token não corresponde ou o token está malformado.' 
            }, { status: 401 });
        }

        // Get tenant with sub and bots
        const tenant = await prisma.tenant.findUnique({
            where: { id: decoded.id },
            include: {
                subscriptions: {
                    where: { type: 'WRITER_PLUGIN' },
                    take: 1
                },
                bots: {
                    select: { id: true, connectionStatus: true }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
        }

        const subscription = tenant.subscriptions[0];
        const subStatus = subscription?.status;
        const hasPlan = subStatus && ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE', 'FREE'].includes(subStatus);
        const hasBot = tenant.bots.length > 0;
        const botConnected = tenant.bots.some(b => b.connectionStatus === 'CONNECTED');

        return NextResponse.json({
            id: tenant.id,
            name: tenant.name || 'Usuário',
            email: tenant.email,
            hasPlan: !!hasPlan,
            subscriptionStatus: subStatus || 'NONE',
            hasBot,
            botConnected,
            debug: {
                subStatus
            }
        });

    } catch (error) {
        console.error('WP Me Error:', error);
        return NextResponse.json({ 
            error: 'Erro interno', 
            details: (error as Error).message 
        }, { status: 500 });
    }
}

