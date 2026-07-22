import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const urlObj = new URL(req.url);
        const clientId = urlObj.searchParams.get('clientId');
        const tenantId = await getEffectiveTenantId(clientId);

        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: driverId } = await params;

        // Fetch driver to ensure it belongs to tenant
        const driver = await prisma.contact.findFirst({
            where: { id: driverId, tenantId, contactType: 'DRIVER' }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Entregador não encontrado' }, { status: 404 });
        }

        // Fetch all orders assigned to this driver
        const orders = await prisma.order.findMany({
            where: { driverId: driver.id },
            include: {
                contact: true,
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200 // Recent 200 deliveries
        });

        // Enrich with extracted city name from address / notes
        const enrichedOrders = orders.map(order => {
            const customer = order.contact || {};
            const rawAddress = customer.notes || customer.needs || '';
            
            // Extract city from address if formatted (e.g. "Rua X, Bairro Y, Bento Gonçalves/RS" or "Bento Gonçalves")
            let city = 'Bento Gonçalves'; // Default fallback
            const match = rawAddress.match(/(?:,\s*|\/\s*)([A-Za-zÀ-ÖØ-öø-ÿ\s]+)(?:-[A-Z]{2}|\/[A-Z]{2}|$)/);
            if (match && match[1]) {
                const candidate = match[1].trim();
                if (candidate.length > 2 && candidate.length < 30) {
                    city = candidate;
                }
            }

            return {
                ...order,
                city
            };
        });

        // Get unique list of cities for filter dropdown
        const cities = Array.from(new Set(enrichedOrders.map(o => o.city))).sort();

        return NextResponse.json({
            driver: {
                id: driver.id,
                name: driver.name,
                phone: driver.phone
            },
            totalCount: enrichedOrders.length,
            cities,
            orders: enrichedOrders
        });
    } catch (error: any) {
        console.error('[API Driver History GET Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
