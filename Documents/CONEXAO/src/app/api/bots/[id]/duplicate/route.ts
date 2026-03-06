import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as any).id;

        const originalBot = await prisma.bot.findUnique({
            where: { id, tenantId: userId },
            include: {
                media: true,
                products: true,
                crmStages: true,
            }
        });

        if (!originalBot) {
            return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
        }

        // Create the new bot
        const newBot = await prisma.bot.create({
            data: {
                name: `${originalBot.name} (Cópia)`,
                tenantId: userId,
                businessType: originalBot.businessType,
                description: originalBot.description,
                systemPrompt: originalBot.systemPrompt,
                aiProvider: originalBot.aiProvider,
                aiModel: originalBot.aiModel,
                voiceId: originalBot.voiceId,
                webhookUrl: originalBot.webhookUrl,
                webhookToken: originalBot.webhookToken,
                chatwootUrl: originalBot.chatwootUrl,
                chatwootToken: originalBot.chatwootToken,
                chatwootAccountId: originalBot.chatwootAccountId,
                enablePayments: originalBot.enablePayments,
                address: originalBot.address,
                hours: originalBot.hours,
                paymentMethods: originalBot.paymentMethods,
                knowledgeBase: originalBot.knowledgeBase,
                status: 'active',

                // Duplicate Media
                media: {
                    create: originalBot.media.map(m => ({
                        type: m.type,
                        url: m.url,
                        filename: m.filename,
                        description: m.description,
                        extractedText: m.extractedText,
                    }))
                },

                // Duplicate Products
                products: {
                    create: originalBot.products.map(p => ({
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        stock: p.stock,
                        imageUrl: p.imageUrl,
                        active: p.active,
                    }))
                },

                // Duplicate CRM Stages (optional, usually bots have their own funnel)
                crmStages: {
                    create: originalBot.crmStages.map(s => ({
                        name: s.name,
                        color: s.color,
                        order: s.order,
                    }))
                }
            }
        });

        return NextResponse.json(newBot);
    } catch (error) {
        console.error('[API] Error duplicating bot:', error);
        return NextResponse.json({ error: 'Falha ao duplicar bot' }, { status: 500 });
    }
}
