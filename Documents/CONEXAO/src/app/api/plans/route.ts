import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        let activeBots = 0;

        if (session?.user) {
            const tenantId = (session.user as any).id;
            activeBots = await prisma.bot.count({
                where: { tenantId }
            });
        }

        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        const gateways = [];
        if (config?.asaasApiKey) gateways.push('asaas');
        if (config?.stripeSecretKey) gateways.push('stripe');
        if (config?.mercadoPagoAccessToken) gateways.push('mercadopago');

        if (gateways.length === 0) gateways.push('asaas'); // Fallback safe default

        const plans = await prisma.plan.findMany({
            where: { active: true },
            orderBy: { price: 'asc' }
        });

        return NextResponse.json({ plans, activeBots, gateways });
    } catch (error) {
        console.error('Error fetching dynamic plans:', error);
        return NextResponse.json({ error: 'Falha ao buscar planos dinâmicos' }, { status: 500 });
    }
}
