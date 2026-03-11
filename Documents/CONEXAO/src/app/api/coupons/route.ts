import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const botId = searchParams.get('botId');

        if (!botId) return NextResponse.json({ error: 'botId is required' }, { status: 400 });

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId: (session.user as any).id }
        });

        if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

        const coupons = await prisma.coupon.findMany({
            where: { botId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(coupons);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { botId, code, type, value, expiresAt, usageLimit } = body;
        
        if (!botId || !code || !value) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId: (session.user as any).id }
        });

        if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

        // Check for duplicate code in same bot
        const existing = await prisma.coupon.findUnique({
            where: { botId_code: { botId, code: code.toUpperCase() } }
        });

        if (existing) {
            return NextResponse.json({ error: 'Cupom já existe para este robô' }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                botId,
                tenantId: (session.user as any).id,
                code: code.toUpperCase(),
                type: type || 'PERCENTAGE',
                value: parseFloat(value),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
            }
        });

        return NextResponse.json(coupon);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
