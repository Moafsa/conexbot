export const dynamic = 'force-dynamic';
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
            where: { 
                id: botId, 
                OR: [
                    { tenantId: (session.user as any).id },
                    { tenant: { managedBy: { tenantId: (session.user as any).id } } }
                ] 
            }
        });

        if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

        const products = await prisma.product.findMany({
            where: { botId },
            include: {
                category: true,
                addonGroups: {
                    include: {
                        addons: true
                    }
                }
            },
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
        const { botId, name, price, salePrice, description, sku, stock, imageUrl, type, billingPeriod, iterations, categoryName, addonGroups } = body;
        if (!botId || !name || price === undefined) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { 
                id: botId, 
                OR: [
                    { tenantId: (session.user as any).id },
                    { tenant: { managedBy: { tenantId: (session.user as any).id } } }
                ] 
            }
        });

        if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

        let categoryId = undefined;
        if (categoryName && categoryName.trim() !== '') {
            let cat = await prisma.productCategory.findFirst({
                where: { botId, name: categoryName.trim() }
            });
            if (!cat) {
                cat = await prisma.productCategory.create({
                    data: { botId, name: categoryName.trim(), active: true }
                });
            }
            categoryId = cat.id;
        }

        const product = await prisma.product.create({
            data: {
                botId,
                categoryId,
                name,
                price: parseFloat(price),
                salePrice: salePrice ? parseFloat(salePrice) : null,
                description,
                sku,
                stock: parseInt(stock || '0'),
                imageUrl,
                type: type || 'SINGLE',
                billingPeriod: billingPeriod as any,
                allowCoupons: body.allowCoupons !== undefined ? body.allowCoupons : true,
                iterations: iterations ? parseInt(iterations.toString()) : null,
                addonGroups: {
                    create: (addonGroups || []).map((group: any) => ({
                        botId,
                        name: group.name,
                        minSelect: group.minSelect,
                        maxSelect: group.maxSelect,
                        active: true,
                        addons: {
                            create: (group.addons || []).map((addon: any) => ({
                                name: addon.name,
                                price: addon.price,
                                active: true
                            }))
                        }
                    }))
                }
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

