
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        // params.id is the BOT ID
        const bot = await prisma.bot.findUnique({
            where: { id: params.id },
            select: { tenantId: true }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
        }

        const contacts = await prisma.contact.findMany({
            where: { tenantId: bot.tenantId },
            orderBy: { lastActive: 'desc' },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });

        return NextResponse.json(contacts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}
