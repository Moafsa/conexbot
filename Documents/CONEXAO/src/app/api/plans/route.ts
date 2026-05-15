export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as any;

        const session = await getServerSession(authOptions);
        let activeBots = 0;
        let tenantAgencyId: string | null = null;

        if (session?.user) {
            const userId = (session.user as any).id;
            const tenant = await prisma.tenant.findUnique({
                where: { id: userId },
                select: { agencyId: true }
            });
            
            if (tenant?.agencyId) {
                tenantAgencyId = tenant.agencyId;
            } else {
                // Also check if the user is the agency owner itself
                const agency = await prisma.agency.findUnique({
                    where: { tenantId: userId }
                });
                if (agency) tenantAgencyId = agency.id;
            }
            
            activeBots = await prisma.bot.count({
                where: { tenantId: userId }
            });
        }

        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        const gateways = [];
        if (config?.asaasApiKey) gateways.push('asaas');
        if (config?.stripeSecretKey) gateways.push('stripe');
        if (config?.mercadoPagoAccessToken) gateways.push('mercadopago');

        if (gateways.length === 0) gateways.push('asaas'); // Fallback safe default

        let plans = await prisma.plan.findMany({
            where: { 
                active: true,
                ...(type ? { type } : {})
            },
            include: {
                productCatalog: true
            },
            orderBy: { price: 'asc' }
        });

        if (tenantAgencyId) {
            const agencyPricings = await prisma.agencyPricing.findMany({
                where: { agencyId: tenantAgencyId }
            });
            const pricingMap = new Map(agencyPricings.map(ap => [ap.productId, ap]));
            
            plans = plans.map(plan => {
                if (plan.productCatalogId) {
                    const override = pricingMap.get(plan.productCatalogId);
                    if (override) {
                        // Use o markupPercent para manter a diferença entre os planos (Basic, Pro, Elite)
                        const markupFactor = 1 + (override.markupPercent / 100);
                        
                        // Apply markup to all available frequencies, but keep setupPrice FIXED as defined by agency
                        return { 
                            ...plan, 
                            price: plan.price * markupFactor,
                            priceQuarterly: plan.priceQuarterly ? (plan.priceQuarterly * markupFactor) : (plan.price * 3 * markupFactor),
                            priceSemiannual: plan.priceSemiannual ? (plan.priceSemiannual * markupFactor) : (plan.price * 6 * markupFactor),
                            priceYearly: plan.priceYearly ? (plan.priceYearly * markupFactor) : (plan.price * 12 * markupFactor),
                            setupPrice: override.setupPrice // Valor fixo e real da agência
                        };
                    }
                }
                return plan;
            });
        }

        return NextResponse.json({ plans, activeBots, gateways });
    } catch (error) {
        console.error('Error fetching dynamic plans:', error);
        return NextResponse.json({ error: 'Falha ao buscar planos dinâmicos' }, { status: 500 });
    }
}
