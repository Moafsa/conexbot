import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");
        const tenantId = await getEffectiveTenantId(clientId);

        if (!tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const botId = searchParams.get('botId');

        const drivers = await prisma.contact.findMany({
            where: {
                tenantId,
                botId: botId || undefined,
                contactType: 'DRIVER'
            },
            include: {
                assignedOrders: {
                    where: {
                        status: { in: ['PENDING', 'DISPATCHED', 'IN_TRANSIT'] }
                    },
                    include: {
                        contact: true // the customer contact (to get their name, phone, address, etc.)
                    }
                }
            }
        });

        return NextResponse.json(drivers);
    } catch (error: any) {
        console.error('[API Drivers GET Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
