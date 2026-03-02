import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createBotSchema } from '@/lib/validations';
import { checkBotLimit } from '@/services/plan-limits';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;
        const body = await req.json();

        console.log('[API /bots POST] TenantId:', tenantId);
        console.log('[API /bots POST] Request body:', JSON.stringify(body, null, 2));

        const parsed = createBotSchema.safeParse(body);

        if (!parsed.success) {
            console.error('[API /bots POST] Validation failed:', parsed.error.issues);
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        console.log('[API /bots POST] Validation passed');

        // Check bot limit
        const limitCheck = await checkBotLimit(tenantId);
        console.log('[API /bots POST] Limit check:', limitCheck);

        if (!limitCheck.allowed) {
            console.warn('[API /bots POST] Limit exceeded:', limitCheck.reason);
            return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
        }

        // Validate Asaas configuration if payments enabled
        if (parsed.data.enablePayments) {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { asaasApiKey: true },
            });

            if (!tenant?.asaasApiKey) {
                console.warn('[API /bots POST] Asaas key missing for payment-enabled bot');
                return NextResponse.json(
                    { error: 'Configure a chave API do Asaas em Configurações antes de habilitar pagamentos' },
                    { status: 400 }
                );
            }
        }

        console.log('[API /bots POST] Creating bot...');

        const bot = await prisma.bot.create({
            data: {
                name: parsed.data.name,
                businessType: parsed.data.businessType,
                voiceId: parsed.data.voiceId || null,
                modules: ['delivery', 'support'],
                address: parsed.data.address,
                hours: parsed.data.hours,
                paymentMethods: parsed.data.paymentMethods || [],
                knowledgeBase: parsed.data.knowledgeBase,
                description: parsed.data.description,
                productsServices: parsed.data.productsServices,
                systemPrompt: parsed.data.systemPrompt,
                websiteUrl: parsed.data.websiteUrl,
                enablePayments: parsed.data.enablePayments || false,
                fallbackContact: parsed.data.fallbackContact,
                aiProvider: parsed.data.aiProvider || 'openai',
                aiModel: parsed.data.aiModel || 'gpt-4o-mini',
                tenantId,
            },
        });

        console.log('[API /bots POST] Bot created successfully:', { id: bot.id, name: bot.name });

        // Initialize default CRM stages
        await prisma.crmStage.createMany({
            data: [
                { botId: bot.id, name: 'NOVO', color: '#3b82f6', order: 0, description: 'Leads recentes' },
                { botId: bot.id, name: 'EM ATENDIMENTO', color: '#f59e0b', order: 1, description: 'Leads em conversação' },
                { botId: bot.id, name: 'APRESENTAÇÃO', color: '#8b5cf6', order: 2, description: 'Proposta enviada' },
                { botId: bot.id, name: 'NEGOCIAÇÃO', color: '#ec4899', order: 3, description: 'Ajustes finos' },
                { botId: bot.id, name: 'GANHO', color: '#10b981', order: 4, description: 'Venda concluída' },
            ]
        });

        console.log('[API /bots POST] Default CRM stages created');

        // Increment bot usage counter
        await prisma.usageCounter.upsert({
            where: { tenantId },
            update: { botsUsed: { increment: 1 } },
            create: {
                tenantId,
                botsUsed: 1,
                botsLimit: 1,
                messagesUsed: 0,
                messagesLimit: 50,
                periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        console.log('[API /bots POST] Usage counter updated');

        // Trigger RAG reindexing for the new bot
        try {
            const { KnowledgeService } = await import('@/services/engine/knowledge');
            await KnowledgeService.reindex(bot.id);
        } catch (reindexError) {
            console.error('[API /bots POST] Initial reindex failed:', reindexError);
        }

        return NextResponse.json(bot, { status: 201 });
    } catch (error) {
        console.error('[API /bots POST] Error creating bot:', error);

        // Log to file for debugging
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'webhook-debug.log');
            fs.appendFileSync(logPath, `[API /bots POST] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))} \n`);
        } catch (e) { console.error('Log failed', e) }

        return NextResponse.json({ error: 'Falha ao criar agente', details: String(error) }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;

        console.log('[API /bots GET] TenantId:', tenantId);

        const bots = await prisma.bot.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { conversations: true } },
            },
        });

        console.log('[API /bots GET] Found', bots.length, 'bots:', bots.map(b => ({ id: b.id, name: b.name, createdAt: b.createdAt })));

        return NextResponse.json(bots);
    } catch (error) {
        console.error('Error fetching bots:', error);
        return NextResponse.json({ error: 'Falha ao buscar agentes' }, { status: 500 });
    }
}
