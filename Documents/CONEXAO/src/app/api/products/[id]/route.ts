export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        // Verify ownership via product -> bot -> tenant
        const product = await prisma.product.findUnique({
            where: { id },
            include: { bot: { include: { tenant: { include: { managedBy: true } } } } }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const isOwner = product.bot.tenantId === (session.user as any).id;
        const isAgency = product.bot.tenant.managedBy?.tenantId === (session.user as any).id;

        if (!isOwner && !isAgency) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        let categoryId = undefined;
        if (body.categoryName !== undefined) {
            if (body.categoryName.trim() === '') {
                categoryId = null;
            } else {
                let cat = await prisma.productCategory.findFirst({
                    where: { botId: product.botId, name: body.categoryName.trim() }
                });
                if (!cat) {
                    cat = await prisma.productCategory.create({
                        data: { botId: product.botId, name: body.categoryName.trim(), active: true }
                    });
                }
                categoryId = cat.id;
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            const updProduct = await tx.product.update({
                where: { id },
                data: {
                    categoryId: categoryId !== undefined ? categoryId : undefined,
                    name: body.name,
                    description: body.description,
                    price: body.price !== undefined ? parseFloat(body.price) : undefined,
                    salePrice: body.salePrice !== undefined ? (body.salePrice ? parseFloat(body.salePrice) : null) : undefined,
                    stock: body.stock !== undefined ? parseInt(body.stock) : undefined,
                    sku: body.sku,
                    imageUrl: body.imageUrl,
                    active: body.active,
                    allowCoupons: body.allowCoupons,
                    type: body.type,
                    billingPeriod: body.billingPeriod,
                    iterations: body.iterations !== undefined ? (body.iterations ? parseInt(body.iterations.toString()) : null) : undefined
                }
            });

            if (body.addonGroups) {
                const existingGroups = await tx.productAddonGroup.findMany({
                    where: { products: { some: { id } } },
                    include: { addons: true }
                });

                const incomingGroupIds = body.addonGroups.map((g: any) => g.id).filter(Boolean);
                
                // Soft delete groups not in payload
                const groupsToDeactivate = existingGroups.filter(g => !incomingGroupIds.includes(g.id));
                for (const g of groupsToDeactivate) {
                    await tx.productAddonGroup.update({ where: { id: g.id }, data: { active: false } });
                }

                for (const group of body.addonGroups) {
                    let groupId = group.id;
                    if (groupId) {
                        await tx.productAddonGroup.update({
                            where: { id: groupId },
                            data: { name: group.name, minSelect: group.minSelect, maxSelect: group.maxSelect, active: true }
                        });
                    } else {
                        const newGroup = await tx.productAddonGroup.create({
                            data: {
                                botId: product.botId,
                                name: group.name,
                                minSelect: group.minSelect,
                                maxSelect: group.maxSelect,
                                active: true,
                                products: { connect: { id } }
                            }
                        });
                        groupId = newGroup.id;
                    }

                    const incomingAddonIds = group.addons.map((a: any) => a.id).filter(Boolean);
                    const existingAddons = existingGroups.find(g => g.id === groupId)?.addons || [];
                    
                    // Soft delete addons not in payload
                    const addonsToDeactivate = existingAddons.filter(a => !incomingAddonIds.includes(a.id));
                    for (const a of addonsToDeactivate) {
                        await tx.productAddon.update({ where: { id: a.id }, data: { active: false } });
                    }

                    for (const addon of group.addons) {
                        if (addon.id) {
                            await tx.productAddon.update({
                                where: { id: addon.id },
                                data: { name: addon.name, price: addon.price, active: true }
                            });
                        } else {
                            await tx.productAddon.create({
                                data: { groupId, name: addon.name, price: addon.price, active: true }
                            });
                        }
                    }
                }
            }
            return updProduct;
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: { bot: { include: { tenant: { include: { managedBy: true } } } } }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const isOwner = product.bot.tenantId === (session.user as any).id;
        const isAgency = product.bot.tenant.managedBy?.tenantId === (session.user as any).id;

        if (!isOwner && !isAgency) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
