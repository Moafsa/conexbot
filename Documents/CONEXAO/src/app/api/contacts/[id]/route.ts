export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function requireContactForTenant(contactId: string, tenantId: string) {
    return prisma.contact.findFirst({
        where: { id: contactId, tenantId },
    });
}

export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const tenantId = (session?.user as { id?: string } | undefined)?.id;
        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const existing = await requireContactForTenant(id, tenantId);
        if (!existing) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        const body = await req.json();
        const { funnelStage, name, email, notes, tags } = body;

        console.log(`[API] Updating contact ${id}:`, body);

        const contact = await prisma.contact.update({
            where: { id },
            data: {
                funnelStage: body.funnelStage,
                stageId: body.stageId,
                name: body.name,
                email: body.email,
                notes: body.notes,
                tags: body.tags,
                isBlocked: body.isBlocked,
                assignedBotId: body.assignedBotId === 'none' ? null : body.assignedBotId
            }
        });

        console.log(`[API] Contact ${id} updated successfully`);
        return NextResponse.json(contact);
    } catch (error) {
        console.error('[API] Error updating contact:', error);
        return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const tenantId = (session?.user as { id?: string } | undefined)?.id;
        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const existing = await requireContactForTenant(id, tenantId);
        if (!existing) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        await prisma.contact.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error deleting contact:', error);
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const tenantId = (session?.user as { id?: string } | undefined)?.id;
        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const contact = await prisma.contact.findFirst({
            where: { id, tenantId },
            include: {
                orders: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        // Conversa sempre no âmbito do tenant (mesmo telefone noutro bot/tenant = outra linha).
        const conversation = await prisma.conversation.findFirst({
            where: {
                remoteId: contact.phone,
                bot: { tenantId },
                ...(contact.botId ? { botId: contact.botId } : {}),
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
