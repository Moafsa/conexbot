import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logToFile } from '@/services/engine/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPERADMIN');
        if (!session || !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await prisma.globalConfig.findUnique({
            where: { id: 'system' }
        });

        return NextResponse.json(config || {
            systemName: "ConextBot",
            googleClientId: "",
            googleClientSecret: "",
            supportEmail: "",
            supportWhatsapp: "",
            maintenanceMode: false,
            smtpHost: "",
            smtpPort: 587,
            smtpUser: "",
            smtpPass: "",
            smtpFrom: "",
            systemBotId: "",
            logoColoredUrl: "",
            logoWhiteUrl: "",
            stripeSecretKey: "",
            stripePublishableKey: "",
            mercadoPagoAccessToken: ""
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const timestamp = new Date().toISOString();
    console.log(`[AdminConfig] [${timestamp}] PUT request received`);
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPERADMIN');
        if (!session || !isAdmin) {
            console.error(`[AdminConfig] [${timestamp}] Unauthorized access attempt`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log(`[AdminConfig] [${timestamp}] Body received, keys:`, Object.keys(body));
        
        // Mapeamento explícito absoluto
        const updatePayload = {
            systemName: body.systemName,
            maintenanceMode: typeof body.maintenanceMode === 'boolean' ? body.maintenanceMode : false,
            supportEmail: body.supportEmail || null,
            supportWhatsapp: body.supportWhatsapp || null,
            asaasApiKey: body.asaasApiKey || null,
            asaasWalletId: body.asaasWalletId || null,
            openaiApiKey: body.openaiApiKey || null,
            geminiApiKey: body.geminiApiKey || null,
            elevenLabsApiKey: body.elevenLabsApiKey || null,
            stripeSecretKey: body.stripeSecretKey || null,
            stripePublishableKey: body.stripePublishableKey || null,
            mercadoPagoAccessToken: body.mercadoPagoAccessToken || null,
            googleClientId: body.googleClientId || null,
            googleClientSecret: body.googleClientSecret || null,
            smtpHost: body.smtpHost || null,
            smtpPort: body.smtpPort ? parseInt(String(body.smtpPort)) : null,
            smtpUser: body.smtpUser || null,
            smtpPass: body.smtpPass || null,
            smtpFrom: body.smtpFrom || null,
            systemBotId: body.systemBotId || null,
            logoColoredUrl: body.logoColoredUrl || null,
            logoWhiteUrl: body.logoWhiteUrl || null
        };

        console.log(`[AdminConfig] [${timestamp}] Attempting upsert...`);
        const config = await prisma.globalConfig.upsert({
            where: { id: 'system' },
            create: {
                id: 'system',
                ...updatePayload
            },
            update: updatePayload
        });

        console.log(`[AdminConfig] [${timestamp}] Upsert success!`);
        return NextResponse.json(config);
    } catch (error) {
        console.error(`[AdminConfig] [${timestamp}] Critical Error:`, error);
        logToFile(`[AdminConfig] [${timestamp}] Critical Error: ${error instanceof Error ? error.message : String(error)}`);
        
        let errorMessage = 'Erro interno do servidor';
        if (error instanceof Error) {
            // Se o erro for do Prisma sobre um campo que não existe, isso indica cache de cliente
            if (error.message.includes('Unknown argument')) {
                errorMessage = `Erro de integridade do banco (Cache Prisma): ${error.message}`;
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json({ 
            error: errorMessage,
            timestamp
        }, { status: 500 });
    }
}
