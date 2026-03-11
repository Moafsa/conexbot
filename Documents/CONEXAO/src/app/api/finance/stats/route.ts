
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;

        // 1. Get Core Stats from Prisma
        const [
            paidOrders,
            pendingOrders,
            totalRevenue,
            subscription,
            tenant
        ] = await Promise.all([
            prisma.order.count({ where: { bot: { tenantId }, status: 'PAID' } }),
            prisma.order.count({ where: { bot: { tenantId }, status: 'PENDING' } }),
            prisma.order.aggregate({
                where: { bot: { tenantId }, status: 'PAID' },
                _sum: { totalAmount: true, commissionAmount: true }
            }),
            prisma.subscription.findUnique({ 
                where: { tenantId },
                include: { plan: true }
            }),
            prisma.tenant.findUnique({ where: { id: tenantId }, select: { asaasApiKey: true } })
        ]);

        // 2. Fetch Asaas Balance if API key exists
        let asaasBalance = 0;
        let asaasError = null;

        if (tenant?.asaasApiKey && tenant.asaasApiKey !== 'mock_key') {
            try {
                const asaasRes = await fetch('https://api.asaas.com/v3/finance/balance', {
                    headers: { 'access_token': tenant.asaasApiKey }
                });
                if (asaasRes.ok) {
                    const balanceData = await asaasRes.json();
                    asaasBalance = balanceData.balance;
                }
            } catch (e) {
                console.error('[Finance Stats] Asaas Balance Error:', e);
                asaasError = "Não foi possível sincronizar com o Asaas.";
            }
        }

        // 3. Sales over time (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesDaily = await prisma.order.groupBy({
            by: ['createdAt'],
            where: {
                bot: { tenantId },
                status: 'PAID',
                createdAt: { gte: sevenDaysAgo }
            },
            _sum: { totalAmount: true }
        });

        // Format daily sales for chart
        const dailyChartData = salesDaily.map(day => ({
            date: day.createdAt.toISOString().split('T')[0],
            amount: day._sum.totalAmount || 0
        }));

        // 4. Invoices/Payments of the Tenant (SaaS Subscription Payments)
        const invoices = await prisma.payment.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 12
        });

        return NextResponse.json({
            summary: {
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                totalCommission: totalRevenue._sum.commissionAmount || 0,
                paidOrders,
                pendingOrders,
                averageTicket: paidOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / paidOrders : 0
            },
            asaas: {
                balance: asaasBalance,
                isLinked: !!tenant?.asaasApiKey,
                error: asaasError
            },
            subscription: subscription ? {
                plan: subscription.plan,
                status: subscription.status
            } : null,
            chartData: dailyChartData,
            invoices: invoices
        });

    } catch (error) {
        console.error('[Finance Stats] Error:', error);
        return NextResponse.json({ error: 'Falha ao buscar estatísticas financeiras' }, { status: 500 });
    }
}
