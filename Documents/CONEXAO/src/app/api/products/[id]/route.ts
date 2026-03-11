import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        // Verify ownership via product -> bot -> tenant
        const product = await prisma.product.findUnique({
            where: { id },
            include: { bot: true }
        });

        if (!product || product.bot.tenantId !== (session.user as any).id) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        const updated = await prisma.product.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description,
                price: body.price !== undefined ? parseFloat(body.price) : undefined,
                salePrice: body.salePrice !== undefined ? (body.salePrice ? parseFloat(body.salePrice) : null) : undefined,
                stock: body.stock !== undefined ? parseInt(body.stock) : undefined,
                sku: body.sku,
                imageUrl: body.imageUrl,
                active: body.active,
                type: body.type,
                billingPeriod: body.billingPeriod,
                iterations: body.iterations !== undefined ? (body.iterations ? parseInt(body.iterations.toString()) : null) : undefined
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: { bot: true }
        });

        if (!product || product.bot.tenantId !== (session.user as any).id) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
