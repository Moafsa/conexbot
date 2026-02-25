import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import { buildSystemPrompt, buildConversationMessages } from '@/services/engine/prompts';
import { chunkKnowledge, retrieveRelevantChunks } from '@/services/engine/knowledge-rag';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { botId, message, history } = await req.json();

        if (!botId || !message) {
            return NextResponse.json(
                { error: 'botId e message são obrigatórios' },
                { status: 400 }
            );
        }

        const tenantId = (session.user as any).id;

        // Fetch bot
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId },
            include: { media: true },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
        }

        // RAG: Get relevant knowledge
        const materialsText = bot.media
            .filter((m: any) => m.extractedText)
            .map((m: any) => m.extractedText as string);

        const chunks = chunkKnowledge(bot.knowledgeBase, bot.scrapedContent, materialsText);
        const relevantKnowledge = retrieveRelevantChunks(chunks, message);

        // Build prompt
        const mediaList = bot.media.map((m: any) => ({
            id: m.id,
            type: m.type,
            description: m.description,
        }));

        const systemPromptText = buildSystemPrompt({
            name: bot.name,
            businessType: bot.businessType,
            address: bot.address,
            hours: bot.hours,
            paymentMethods: bot.paymentMethods,
            systemPrompt: bot.systemPrompt,
            websiteUrl: bot.websiteUrl || undefined,
            relevantKnowledge: relevantKnowledge || undefined,
            mediaList: mediaList.length > 0 ? mediaList : undefined,
            fallbackContact: bot.fallbackContact || undefined,
            enablePayments: bot.enablePayments,
        });

        // Convert test history to OpenAI format
        const conversationHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        }));

        const messages = buildConversationMessages(systemPromptText, conversationHistory);
        messages.push({ role: 'user', content: message });

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.8,
            max_tokens: 500,
        });

        const response = completion.choices[0]?.message?.content?.trim() || 'Desculpe, não entendi.';

        return NextResponse.json({ response });
    } catch (error) {
        console.error('Test bot error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar mensagem' },
            { status: 500 }
        );
    }
}
