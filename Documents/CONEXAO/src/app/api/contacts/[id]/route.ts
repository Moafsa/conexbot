
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.contact.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error deleting contact:', error);
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
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

        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        // Fetch recent messages for context
        // We find conversation by remoteId (phone) and botId
        // Improvement: If contact has a botId, use it. Otherwise try to find any conversation with this phone.
        const conversation = await prisma.conversation.findFirst({
            where: {
                remoteId: contact.phone,
                ...(contact.botId ? { botId: contact.botId } : {})
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    take: 100 // Limit to recent 100 messages for the panel
                }
            }
        });

        // Attach conversations format as expected by CRMContactPanel
        const responseData = {
            ...contact,
            conversations: conversation ? [conversation] : []
        };

        return NextResponse.json(responseData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
    }
}
