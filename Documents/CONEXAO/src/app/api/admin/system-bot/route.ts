import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;

        // Check if system bot already exists
        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } }) as any;
        
        let botId = config?.systemBotId;

        if (!botId) {
            // Create a new bot for the system
            const bot = await prisma.bot.create({
                data: {
                    name: "Sistema - Avisos",
                    businessType: "SYSTEM",
                    sessionName: `system-bot-${Math.random().toString(36).substring(7)}`,
                    tenantId: tenantId,
                    description: "Bot global do sistema para notificações e alertas.",
                    modules: [],
                    knowledgeBase: "Bot de sistema.",
                    systemPrompt: "Você é o assistente de notificações do sistema ConextBot.",
                    aiProvider: "openai",
                    aiModel: "gpt-4o-mini",
                }
            });
            botId = bot.id;

            // Update global config
            await prisma.globalConfig.upsert({
                where: { id: 'system' },
                create: { id: 'system', systemBotId: botId },
                update: { systemBotId: botId }
            });
        }

        return NextResponse.json({ botId });
    } catch (error) {
        console.error('[SystemBot API] Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } }) as any;
        if (!config?.systemBotId) {
            return NextResponse.json({ status: 'NOT_CONNECTED' });
        }

        const bot = await prisma.bot.findUnique({ where: { id: config.systemBotId } });
        if (!bot) {
            return NextResponse.json({ status: 'NOT_CONNECTED' });
        }

        const liveStatus = bot.sessionName ? await UzapiService.getSessionStatus(bot.sessionName) : 'DISCONNECTED';

        return NextResponse.json({
            status: liveStatus,
            botName: bot.name,
            botId: bot.id
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } }) as any;
        if (!config?.systemBotId) {
            return NextResponse.json({ success: true });
        }

        const bot = await prisma.bot.findUnique({ where: { id: config.systemBotId } });
        if (bot?.sessionName) {
            await UzapiService.logout(bot.sessionName);
            await prisma.bot.update({
                where: { id: bot.id },
                data: { connectionStatus: 'DISCONNECTED' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
