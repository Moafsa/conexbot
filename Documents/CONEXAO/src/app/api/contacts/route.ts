export const dynamic = 'force-dynamic';
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
        
        const userEmail = session.user.email;


        const botId = searchParams.get('botId');
        const pipelineId = searchParams.get('pipelineId');
        const search = searchParams.get('search') || '';

        if (!botId) {
            return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
        }

        // Fetch bot
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
        }

        // 1. If Chatwoot integration is active, fetch from Chatwoot
        if (bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId) {
            // Get active pipeline
            let activePipeline = null;
            if (pipelineId) {
                activePipeline = await prisma.crmPipeline.findFirst({
                    where: { id: pipelineId, botId }
                });
            } else {
                activePipeline = await prisma.crmPipeline.findFirst({
                    where: { botId },
                    orderBy: { createdAt: 'asc' }
                });
            }

            // Verify agent permission if pipeline restricts access
            if (activePipeline && activePipeline.allowedAgents.length > 0) {
                const isAllowed = userEmail && activePipeline.allowedAgents.includes(userEmail);
                // If logged in user is the owner/tenant admin, bypass this
                const isTenantAdmin = (session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPERADMIN' || (session.user as any).id === tenantId;
                if (!isAllowed && !isTenantAdmin) {
                    return NextResponse.json([]); // Not allowed to see this funnel
                }
            }

            // Fetch pipeline stages to map
            const stages = activePipeline 
                ? await prisma.crmStage.findMany({ where: { pipelineId: activePipeline.id }, orderBy: { order: 'asc' } })
                : [];
            
            const firstStageId = stages[0]?.id || null;
            const firstStageName = stages[0]?.name || 'NOVO';

            // Query Chatwoot API
            const baseUrl = bot.chatwootUrl.replace(/\/$/, '');
            // Fetch all active/resolved/pending conversations
            const url = `${baseUrl}/api/v1/accounts/${bot.chatwootAccountId}/conversations?status=all`;

            let conversations = [];
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'api_access_token': bot.chatwootToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    conversations = data.payload || [];
                } else {
                    console.error('[API /api/contacts] Chatwoot fetch failed status:', response.status);
                }
            } catch (err: any) {
                console.error('[API /api/contacts] Chatwoot fetch exception:', err.message);
            }

            if (conversations.length > 0) {
                // Map conversations to Contacts format
                const mappedContacts = conversations.map((conv: any) => {
                    const sender = conv.meta?.sender || {};
                    const customAttrs = conv.custom_attributes || {};
                    
                    // SLA alerts parsing
                    const slaDateStr = customAttrs.retorno_agendado || customAttrs.sla_limite || null;
                    
                    // Channel parsing
                    const channelName = conv.meta?.channel || 'whatsapp';

                    // Stage ID from Chatwoot Custom Attributes or default to first stage
                    let stageId = customAttrs.crm_stage_id || null;
                    let stageName = firstStageName;

                    if (stageId) {
                        const matchedStage = stages.find(s => s.id === stageId);
                        if (matchedStage) {
                            stageName = matchedStage.name;
                        } else {
                            // Stage no longer exists or belongs to another pipeline
                            stageId = firstStageId;
                            stageName = firstStageName;
                        }
                    } else {
                        stageId = firstStageId;
                        stageName = firstStageName;
                    }

                    // AI Insights, sentiment, finance, lead score
                    const sentiment = customAttrs.sentiment || 'NEUTRAL';
                    const leadScore = parseInt(customAttrs.lead_score || '50', 10);
                    const lastAiInsight = customAttrs.ai_summary || customAttrs.ai_insight || null;
                    const dealValue = parseFloat(customAttrs.financeiro_valor || customAttrs.deal_value || '0');

                    return {
                        id: String(conv.id), // Use Chatwoot Conversation ID
                        name: sender.name || sender.phone_number || `Conversa #${conv.id}`,
                        phone: sender.phone_number || '',
                        email: sender.email || '',
                        funnelStage: stageName,
                        stageId: stageId,
                        leadScore: leadScore,
                        sentiment: sentiment,
                        lastAiInsight: lastAiInsight,
                        lastActive: conv.updated_at ? new Date(conv.updated_at * 1000).toISOString() : new Date().toISOString(),
                        isBlocked: sender.blocked || false,
                        notes: customAttrs.notes || null,
                        // Additional CRM Kanban custom fields
                        channel: channelName,
                        priority: conv.priority || 'none',
                        slaExpiresAt: slaDateStr,
                        assignedAgentName: conv.meta?.assignee?.name || null,
                        assignedAgentAvatar: conv.meta?.assignee?.avatar_url || null,
                        dealValue: dealValue,
                        chatwootConversationId: conv.id,
                        stage: stageId ? { id: stageId, name: stageName } : null
                    };
                });

                // If a search query is provided, perform case-insensitive filter
                if (search) {
                    const searchLower = search.toLowerCase();
                    return NextResponse.json(
                        mappedContacts.filter((c: any) => 
                            c.name.toLowerCase().includes(searchLower) || 
                            c.phone.toLowerCase().includes(searchLower) ||
                            (c.lastAiInsight && c.lastAiInsight.toLowerCase().includes(searchLower))
                        )
                    );
                }

                return NextResponse.json(mappedContacts);
            }
        }

        // 2. Fallback: Bot doesn't have Chatwoot, use local database
        const whereCondition: any = {
            tenantId: tenantId,
            botId: botId || undefined
        };

        if (search) {
            const matchedMessages = await prisma.message.findMany({
                where: {
                    content: { contains: search, mode: 'insensitive' },
                    conversation: { botId: botId || undefined, bot: { tenantId } }
                },
                select: { conversation: { select: { remoteId: true } } }
            });

            const matchedPhones = matchedMessages.map((m: any) => m.conversation.remoteId).filter(Boolean);

            whereCondition.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { phone: { in: matchedPhones.length > 0 ? matchedPhones : ['____NO_MATCH____'] } }
            ];
        }

        const contacts = await prisma.contact.findMany({
            where: whereCondition,
            include: {
                stage: true,
                orders: true
            },
            orderBy: {
                lastActive: 'desc'
            }
        });

        const phoneList = contacts.map(c => c.phone);
        const conversations = await prisma.conversation.findMany({
            where: {
                remoteId: { in: phoneList }
            },
            select: { remoteId: true, pausedUntil: true }
        });

        const conversationMap = new Map();
        conversations.forEach(conv => {
            if (conv.pausedUntil && new Date(conv.pausedUntil) > new Date()) {
                conversationMap.set(conv.remoteId, conv.pausedUntil);
            }
        });

        const enrichedContacts = contacts.map(c => ({
            ...c,
            isPaused: conversationMap.has(c.phone),
            pausedUntil: conversationMap.get(c.phone) || null
        }));

        return NextResponse.json(enrichedContacts);
    } catch (error) {
        console.error('[API] Error fetching contacts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
