import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decode } from 'next-auth/jwt';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const queryToken = searchParams.get('token');
        const authHeader = req.headers.get('authorization');
        
        const token = queryToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const secret = process.env.NEXTAUTH_SECRET || '';

        // Decode token
        let decoded;
        try {
            decoded = await decode({
                token,
                secret,
                // Use a standard salt if none is provided. 
                // NextAuth typically uses the cookie name as salt.
                salt: 'next-auth.session-token'
            }) as any;
        } catch (e: any) {
            console.error('JWT Decode Exception:', e);
            return NextResponse.json({ error: 'Falha ao decodificar token', details: e.message }, { status: 401 });
        }

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

        const subStatus = tenant.subscription?.status;
        const hasPlan = subStatus && ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE'].includes(subStatus);
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
        return NextResponse.json({ 
            error: 'Erro interno', 
            details: (error as Error).message 
        }, { status: 500 });
    }
}
