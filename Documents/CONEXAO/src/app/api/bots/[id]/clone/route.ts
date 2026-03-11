import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const tenantId = (session.user as any).id;

        // 1. Fetch original bot with relations
        const originalBot = await prisma.bot.findFirst({
            where: { id, tenantId },
            include: {
                materials: true,
                followupRules: true,
                crmStages: true,
                products: true
            }
        });

        if (!originalBot) {
            return NextResponse.json({ error: 'Agente original não encontrado' }, { status: 404 });
        }

        // 2. check limits
        const usage = await prisma.usageCounter.findUnique({ where: { tenantId } });
        if (usage && usage.botsUsed >= (usage as any).botsLimit) {
            return NextResponse.json({ error: 'Limite de agentes atingido' }, { status: 403 });
        }

        // 3. Create cloned bot
        const clonedBot = await prisma.bot.create({
            data: {
                tenantId,
                masterId: id, // Link the clone to its master bot for isolation
                name: `${originalBot.name} (Cópia)`,
                businessType: originalBot.businessType,
                description: originalBot.description,
                systemPrompt: originalBot.systemPrompt,
                aiProvider: originalBot.aiProvider,
                aiModel: originalBot.aiModel,
                voiceId: originalBot.voiceId,
                enablePayments: originalBot.enablePayments,
                webhookUrl: originalBot.webhookUrl,
                webhookToken: originalBot.webhookToken,
                chatwootUrl: originalBot.chatwootUrl,
                chatwootToken: originalBot.chatwootToken,
                chatwootAccountId: originalBot.chatwootAccountId,
                connectToken: uuidv4(),
                // Relations
                materials: {
                    create: (originalBot as any).materials.map((m: any) => ({
                        name: m.name,
                        type: m.type,
                        url: m.url,
                        tenantId: m.tenantId
                    }))
                },
                followupRules: {
                    create: (originalBot as any).followupRules.map((r: any) => ({
                        name: r.name,
                        triggerDays: r.triggerDays,
                        triggerType: r.triggerType,
                        message: r.message,
                        active: r.active,
                        tenantId: r.tenantId
                    }))
                },
                crmStages: {
                    create: (originalBot as any).crmStages.map((s: any) => ({
                        name: s.name,
                        color: s.color,
                        order: s.order,
                        description: s.description
                    }))
                },
                products: {
                    create: (originalBot as any).products.map((p: any) => ({
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        currency: p.currency,
                        stock: p.stock,
                        imageUrl: p.imageUrl,
                        videoUrl: (p as any).videoUrl,
                        active: p.active
                    }))
                }
            }
        });

        // 4. Update usage counter
        await prisma.usageCounter.update({
            where: { tenantId },
            data: { botsUsed: { increment: 1 } }
        });

        return NextResponse.json(clonedBot);
    } catch (error: any) {
        console.error('[API Bot Clone] Error:', error);
        return NextResponse.json({ error: 'Erro ao clonar agente: ' + error.message }, { status: 500 });
    }
}
