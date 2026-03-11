import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { botId, token } = await req.json();

        if (!botId && !token) {
            return NextResponse.json({ error: 'botId ou token são necessários' }, { status: 400 });
        }

        let bot;
        if (session?.user && botId) {
            const tenantId = (session.user as any).id;
            bot = await prisma.bot.findFirst({
                where: { id: botId, tenantId },
            });
        } else if (token) {
            bot = await prisma.bot.findFirst({
                where: { connectToken: token },
            });
        }

        if (!bot) {
            return NextResponse.json({ error: 'Não autorizado ou agente não encontrado' }, { status: 401 });
        }

        // Generate unique session name
        const sessionName = `bot-${bot.id.substring(0, 8)}`;

        try {
            const fs = require('fs');
            fs.appendFileSync('connect-debug.log', `[${new Date().toISOString()}] Connecting ${sessionName}...\n`);
            fs.appendFileSync('connect-debug.log', `[${new Date().toISOString()}] UZAPI_URL: ${process.env.UZAPI_URL}\n`);
        } catch (e) { }

        console.log('[Connect] Step 1: Session name generated', sessionName);

        // Ensure UZAPI can reach Next.js (host machine) from Docker container
        let baseUrl = process.env.INTERNAL_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL;

        // Dynamic Port Resolution for Local Dev
        if (!baseUrl) {
            const hostHeader = req.headers.get('host') || 'localhost:3000';
            if (hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1')) {
                // If running locally, Docker needs 'host.docker.internal' to reach the host machine
                const port = hostHeader.split(':')[1] || '3000';
                baseUrl = `http://host.docker.internal:${port}`;
            } else {
                // Production fallback
                const protocol = req.headers.get('x-forwarded-proto') || 'https';
                baseUrl = `${protocol}://${hostHeader}`;
            }
        }

        const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;
        console.log('[Connect] Step 2: Webhook URL', webhookUrl);

        // Start UZAPI session
        console.log(`[Connect] Calling startSession for ${sessionName} to ${webhookUrl}`);
        const { success, error } = await UzapiService.startSession(sessionName, webhookUrl);

        if (!success) {
            console.error('[Connect] Step 3: UzapiService.startSession failed:', error);
            try {
                const healthParams = await fetch(`${process.env.UZAPI_URL}/health`);
                console.log(`[Connect] UZAPI Health Check: ${healthParams.status} ${await healthParams.text()}`);
            } catch(e:any) {
                console.error(`[Connect] UZAPI Health Check Failed: ${e.message}`);
            }
            return NextResponse.json({ error: error || 'Falha ao iniciar sessão WhatsApp (WuzAPI Indisponível)' }, { status: 500 });
        }

        console.log('[Connect] Step 4: Session started successfully');

        // Save session name to bot
        await prisma.bot.update({
            where: { id: bot.id },
            data: {
                sessionName,
                connectionStatus: 'QRCODE'
            },
        });

        console.log('[Connect] Step 5: Bot updated in DB');

        // Check current status before QR
        const currentStatus = await UzapiService.getSessionStatus(sessionName);
        console.log('[Connect] Step 5.5: Current status is', currentStatus);

        if (currentStatus === 'CONNECTED') {
            await prisma.bot.update({
                where: { id: bot.id },
                data: { connectionStatus: 'CONNECTED', sessionName }
            });
            return NextResponse.json({
                session: sessionName,
                status: 'CONNECTED',
                qrCodeUrl: ''
            });
        }

        // Fetch QR Code Base64 with a small retry if missing
        let qrCode = await UzapiService.getQrCode(sessionName);
        
        if (!qrCode && currentStatus === 'QRCODE') {
            console.log('[Connect] QR not ready, waiting 2s...');
            await new Promise(r => setTimeout(r, 2000));
            qrCode = await UzapiService.getQrCode(sessionName);
        }

        console.log('[Connect] Step 6: QR Code fetched', qrCode ? 'YES' : 'NO');

        return NextResponse.json({
            session: sessionName,
            status: currentStatus === 'QRCODE' ? 'QRCODE' : 'GENERATING_QR',
            qrCodeUrl: qrCode || '',
        });

    } catch (error: any) {
        const errorMsg = `[${new Date().toISOString()}] Connect Catch Error: ${error.message}\nStack: ${error.stack}\n`;
        try { require('fs').appendFileSync('connect-debug.log', errorMsg); } catch (e) {}
        console.error('WhatsApp Connection Detailed Error:', error);
        return NextResponse.json({ error: 'Falha ao conectar WhatsApp', details: error.message }, { status: 500 });
    }
}
