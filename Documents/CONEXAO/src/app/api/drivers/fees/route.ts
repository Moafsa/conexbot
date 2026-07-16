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

        const bot = await prisma.bot.findFirst({
            where: { tenantId },
            select: { deliveryFeeType: true, deliveryFeeRules: true }
        });

        return NextResponse.json({
            deliveryFeeType: bot?.deliveryFeeType || 'FIXED',
            deliveryFeeRules: bot?.deliveryFeeRules || []
        });
    } catch (error: any) {
        console.error('[API Drivers Fees GET Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
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

        const body = await req.json();
        const { deliveryFeeType, deliveryFeeRules } = body;

        const bot = await prisma.bot.findFirst({
            where: { tenantId }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot não encontrado para o tenant' }, { status: 404 });
        }

        const updated = await prisma.bot.update({
            where: { id: bot.id },
            data: {
                deliveryFeeType: deliveryFeeType || 'FIXED',
                deliveryFeeRules: deliveryFeeRules || []
            }
        });

        return NextResponse.json({ success: true, botId: updated.id });
    } catch (error: any) {
        console.error('[API Drivers Fees POST Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
