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

        const products = await prisma.product.findMany({
            where: { botId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { botId, name, price, description, sku, stock, imageUrl } = body;

        if (!botId || !name || price === undefined) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId: (session.user as any).id }
        });

        if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

        const product = await prisma.product.create({
            data: {
                botId,
                name,
                price: parseFloat(price),
                description,
                sku,
                stock: parseInt(stock || '0'),
                imageUrl
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
