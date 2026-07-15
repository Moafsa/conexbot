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
        const { name, phone, dispatchKeywords } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 });
        }

        const normalizedPhone = phone.replace(/\D/g, '');

        const bot = await prisma.bot.findFirst({
            where: { tenantId }
        });

        // Check if driver contact already exists (by phone) for this bot
        const existing = await prisma.contact.findFirst({
            where: { phone: normalizedPhone, botId: bot?.id || null }
        });

        if (existing) {
            // Update existing to be a driver
            const updated = await prisma.contact.update({
                where: { id: existing.id },
                data: {
                    name,
                    contactType: 'DRIVER',
                    dispatchKeywords
                }
            });
            return NextResponse.json(updated);
        }

        const driver = await prisma.contact.create({
            data: {
                name,
                phone: normalizedPhone,
                dispatchKeywords,
                contactType: 'DRIVER',
                tenantId,
                botId: bot?.id || null
            }
        });

        return NextResponse.json(driver);
    } catch (error: any) {
        console.error('[API Drivers POST Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
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
        const { id, name, phone, dispatchKeywords } = body;

        if (!id || !name || !phone) {
            return NextResponse.json({ error: 'ID, nome e telefone são obrigatórios' }, { status: 400 });
        }

        const normalizedPhone = phone.replace(/\D/g, '');

        const driver = await prisma.contact.update({
            where: { 
                id,
                tenantId
            },
            data: {
                name,
                phone: normalizedPhone,
                dispatchKeywords
            }
        });

        return NextResponse.json(driver);
    } catch (error: any) {
        console.error('[API Drivers PUT Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
