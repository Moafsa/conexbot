import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageProcessor } from '@/services/engine/processor';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { botId, message, sessionId, contactInfo } = body;

        if (!botId || !message) {
            return NextResponse.json({ error: 'Parâmetros botId e message são obrigatórios' }, { status: 400 });
        }

        const cleanBotId = botId.trim();
        console.log(`[WebChat API] POST received for botId: "${cleanBotId}"`);
        
        // 1. Validar Bot
        let bot;
        try {
            bot = await prisma.bot.findUnique({
                where: { id: cleanBotId }
            });
        } catch (dbErr: any) {
            console.error(`[WebChat API] Database error finding bot:`, dbErr);
            return NextResponse.json({ error: 'Erro ao buscar bot no banco', detail: dbErr.message }, { status: 500 });
        }

        if (!bot) {
            console.error(`[WebChat API] Bot NOT FOUND: "${cleanBotId}"`);
            return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
        }

        if (bot.status !== 'active') {
             console.warn(`[WebChat API] Bot NOT ACTIVE: "${cleanBotId}", status: ${bot.status}`);
        }

        // 1.5. Atualizar Informações de Contato (WordPress context)
        if (contactInfo && (contactInfo.name || contactInfo.email)) {
             try {
                 await prisma.contact.upsert({
                     where: { phone_botId: { phone: sessionId || 'web_user', botId: bot.id } },
                     update: {
                         name: contactInfo.name || undefined,
                         email: contactInfo.email || undefined,
                         lastActive: new Date()
                     },
                     create: {
                         phone: sessionId || 'web_user',
                         botId: bot.id,
                         tenantId: bot.tenantId,
                         name: contactInfo.name || undefined,
                         email: contactInfo.email || undefined,
                         funnelStage: 'LEAD'
                     } as any
                 });
                 console.log(`[WebChat API] Contact updated from WP context: ${contactInfo.email || contactInfo.name}`);
             } catch (contactErr) {
                 console.error('[WebChat API] Error upserting contact:', contactErr);
             }
        }

        // 2. Processar Mensagem
        let response;
        try {
            response = await MessageProcessor.process(
                bot.id, 
                sessionId || 'web_user', 
                message, 
                'generic',
                'id'
            );
        } catch (procErr: any) {
            console.error(`[WebChat API] MessageProcessor CRASHED:`, procErr);
            return NextResponse.json({ error: 'Erro no processamento da IA', detail: procErr.message }, { status: 500 });
        }

        if (!response) {
            console.error(`[WebChat API] MessageProcessor returned NULL for bot: ${bot.id}`);
            return NextResponse.json({ error: 'A IA não retornou uma resposta' }, { status: 500 });
        }

        return NextResponse.json({ 
            text: response.text,
            media: response.media || []
        });

    } catch (error: any) {
        console.error('[WebChat API Fatal Error]:', error);
        return NextResponse.json({ error: 'Erro interno fatal', detail: error.message }, { status: 500 });
    }
}
