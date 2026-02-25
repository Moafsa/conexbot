import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;
        const { botId } = await req.json();

        if (!botId) {
            return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
        }

        // Verify bot ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        // Generate unique session name
        const sessionName = `bot-${bot.id.substring(0, 8)}`;

        try {
            const fs = require('fs');
            fs.appendFileSync('connect-debug.log', `[${new Date().toISOString()}] Connecting ${sessionName}...\n`);
            fs.appendFileSync('connect-debug.log', `[${new Date().toISOString()}] UZAPI_URL: ${process.env.UZAPI_URL}\n`);
        } catch (e) { }

        // Ensure UZAPI can reach Next.js (host machine) from Docker container
        // WARNING: If you change the Next.js port, update this line or set INTERNAL_WEBHOOK_URL env var
        const baseUrl = process.env.INTERNAL_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://host.docker.internal:3000';
        const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;

        // Start UZAPI session
        const { success, error } = await UzapiService.startSession(sessionName, webhookUrl);

        if (!success) {
            console.error('UzapiService.startSession failed:', error);
            return NextResponse.json({ error: error || 'Falha ao iniciar sessão WhatsApp' }, { status: 500 });
        }

        // Save session name to bot
        await prisma.bot.update({
            where: { id: botId },
            data: {
                sessionName,
                connectionStatus: 'QRCODE'
            },
        });

        // Fetch QR Code Base64
        const qrCode = await UzapiService.getQrCode(sessionName);

        return NextResponse.json({
            session: sessionName,
            status: 'GENERATING_QR',
            qrCodeUrl: qrCode || '', // Use the base64 string here
        });

    } catch (error) {
        console.error('WhatsApp Connection Error:', error);
        try {
            const fs = require('fs');
            fs.appendFileSync('connect-debug.log', `[${new Date().toISOString()}] Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        } catch (e) { }
        return NextResponse.json({ error: 'Falha ao conectar WhatsApp', details: String(error) }, { status: 500 });
    }
}
