
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { funnelStage, name, email, notes, tags } = body;

        const contact = await prisma.contact.update({
            where: { id },
            data: {
                funnelStage,
                name,
                email,
                notes,
                tags
            }
        });

        return NextResponse.json(contact);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const contact = await prisma.contact.findUnique({
            where: { id },
            include: {
                orders: true
            }
        });

        // Fetch recent messages for context
        // We need conversation ID first
        // This might be complex if we don't have conversation ID handy, 
        // but we can find conversation by remoteId (phone) and tenant's bot.
        // For now, just return contact details.

        return NextResponse.json(contact);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
    }
}
