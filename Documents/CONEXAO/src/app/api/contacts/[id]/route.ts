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
        const body = await req.json();
        const { funnelStage, stageId, botId, name, email, notes } = body;

        console.log(`[API] Updating contact/conversation ${id}:`, body);

        // 1. Check if the bot has Chatwoot integration
        if (botId) {
            const bot = await prisma.bot.findFirst({
                where: { id: botId, tenantId }
            });

            if (bot && bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId) {
                const baseUrl = bot.chatwootUrl.replace(/\/$/, '');
                const chatwootUrl = `${baseUrl}/api/v1/accounts/${bot.chatwootAccountId}/conversations/${id}/custom_attributes`;

                const response = await fetch(chatwootUrl, {
                    method: 'POST',
                    headers: {
                        'api_access_token': bot.chatwootToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        custom_attributes: {
                            crm_stage_id: stageId
                        }
                    })
                });

                if (!response.ok) {
                    console.error(`[API /api/contacts/${id}] Chatwoot custom_attributes update failed:`, response.status, await response.text());
                } else {
                    console.log(`[API /api/contacts/${id}] Chatwoot conversation stage updated successfully`);
                }
            }
        }

        // 2. Also update in local database if contact exists
        const existing = await requireContactForTenant(id, tenantId);
        if (existing) {
            const contact = await prisma.contact.update({
                where: { id },
                data: {
                    funnelStage: funnelStage,
                    stageId: stageId,
                    name: name || undefined,
                    email: email || undefined,
                    notes: notes || undefined,
                    assignedBotId: body.assignedBotId === 'none' ? null : body.assignedBotId
                }
            });
            return NextResponse.json(contact);
        }

        // Return a mock contact object so the frontend drag-and-drop state updates correctly
        return NextResponse.json({
            id,
            funnelStage,
            stageId,
            name,
            email,
            notes
        });
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
        const urlObj = new URL(req.url);
        const botId = urlObj.searchParams.get('botId');

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

        if (!contact && botId) {
            // Check if this is a Chatwoot conversation ID
            const bot = await prisma.bot.findFirst({
                where: { id: botId, tenantId }
            });

            if (bot && bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId) {
                const baseUrl = bot.chatwootUrl.replace(/\/$/, '');
                // 1. Fetch Chatwoot conversation details
                const convUrl = `${baseUrl}/api/v1/accounts/${bot.chatwootAccountId}/conversations/${id}`;
                const convRes = await fetch(convUrl, {
                    headers: { 'api_access_token': bot.chatwootToken }
                });

                if (convRes.ok) {
                    const convData = await convRes.json();
                    
                    // 2. Fetch Chatwoot conversation messages
                    const messagesUrl = `${baseUrl}/api/v1/accounts/${bot.chatwootAccountId}/conversations/${id}/messages`;
                    const messagesRes = await fetch(messagesUrl, {
                        headers: { 'api_access_token': bot.chatwootToken }
                    });
                    
                    let cwMessages = [];
                    if (messagesRes.ok) {
                        const msgData = await messagesRes.json();
                        cwMessages = msgData.payload || [];
                    }

                    // Get contact stage
                    const customAttributes = convData.custom_attributes || {};
                    const crmStageId = customAttributes.crm_stage_id;
                    
                    let stage = null;
                    if (crmStageId) {
                        stage = await prisma.crmStage.findUnique({
                            where: { id: crmStageId }
                        });
                    }
                    if (!stage) {
                        stage = await prisma.crmStage.findFirst({
                            where: { botId },
                            orderBy: { order: 'asc' }
                        });
                    }

                    // Format messages for the CRM panel
                    const formattedMessages = cwMessages.map((m: any) => ({
                        id: String(m.id),
                        content: m.content || "",
                        role: m.message_type === 'incoming' ? 'user' : 'assistant',
                        createdAt: m.created_at ? new Date(m.created_at * 1000).toISOString() : new Date().toISOString()
                    })).reverse(); // Chatwoot returns messages desc usually, reverse for panel asc

                    return NextResponse.json({
                        id,
                        name: convData.meta?.sender?.name || convData.meta?.sender?.phone_number || 'Chatwoot User',
                        phone: convData.meta?.sender?.phone_number || '00000000000',
                        email: convData.meta?.sender?.email || null,
                        funnelStage: stage?.name || 'LEAD',
                        stageId: stage?.id || null,
                        leadScore: customAttributes.lead_score || 50,
                        sentiment: customAttributes.sentiment || 'NEUTRAL',
                        lastAiInsight: customAttributes.last_ai_insight || null,
                        lastActive: convData.updated_at ? new Date(convData.updated_at * 1000).toISOString() : new Date().toISOString(),
                        isBlocked: false,
                        notes: customAttributes.notes || null,
                        orders: [],
                        conversations: [
                            {
                                id,
                                messages: formattedMessages
                            }
                        ]
                    });
                }
            }
        }

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
