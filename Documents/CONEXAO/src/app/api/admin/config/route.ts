export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logToFile } from '@/services/engine/logger';

// Campos que guardam segredos/credenciais. Nunca devem ser devolvidos em texto
// puro para o navegador — mesmo para admins autenticados, expandir a superfície
// de exposição (Network tab, DevTools, extensões, prints de tela) não vale a pena.
// O front recebe apenas um mapa `secretsConfigured` indicando o que já está
// preenchido; o valor real só é sobrescrito se o admin digitar um novo.
const SENSITIVE_FIELDS = [
    'googleClientSecret',
    'googleAdsDeveloperToken',
    'openaiApiKey',
    'geminiApiKey',
    'asaasApiKey',
    'elevenLabsApiKey',
    'smtpPass',
    'mercadoPagoAccessToken',
    'stripeSecretKey',
    'openrouterApiKey',
    'metaAppSecret',
    'metaVerifyToken',
    'mlClientSecret',
    'chatwootSuperAdminToken',
    'anthropicApiKey',
] as const;

function sanitizeConfig(config: Record<string, any>) {
    const sanitized: Record<string, any> = { ...config };
    const secretsConfigured: Record<string, boolean> = {};
    for (const field of SENSITIVE_FIELDS) {
        secretsConfigured[field] = !!config?.[field];
        sanitized[field] = '';
    }
    sanitized.secretsConfigured = secretsConfigured;
    return sanitized;
}

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

        const base = config || {
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
            mercadoPagoAccessToken: "",
            metaAppId: "",
            metaAppSecret: "",
            metaVerifyToken: "",
            metaWhatsappConfigId: "",
            metaInstagramConfigId: "",
            mapboxToken: ""
        };

        return NextResponse.json(sanitizeConfig(base));
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

        // Mapeamento explícito absoluto (apenas campos não sensíveis — os
        // sensíveis são tratados abaixo, já que agora o GET não devolve mais
        // o valor real e um campo "vazio" no formulário não deve apagar o
        // segredo já salvo).
        const updatePayload: Record<string, any> = {
            systemName: body.systemName,
            maintenanceMode: typeof body.maintenanceMode === 'boolean' ? body.maintenanceMode : false,
            supportEmail: body.supportEmail || null,
            supportWhatsapp: body.supportWhatsapp || null,
            asaasWalletId: body.asaasWalletId || null,
            stripePublishableKey: body.stripePublishableKey || null,
            googleClientId: body.googleClientId || null,
            smtpHost: body.smtpHost || null,
            smtpPort: body.smtpPort ? parseInt(String(body.smtpPort)) : null,
            smtpUser: body.smtpUser || null,
            smtpFrom: body.smtpFrom || null,
            systemBotId: body.systemBotId || null,
            logoColoredUrl: body.logoColoredUrl || null,
            logoWhiteUrl: body.logoWhiteUrl || null,
            metaAppId: body.metaAppId || null,
            metaWhatsappConfigId: body.metaWhatsappConfigId || null,
            metaInstagramConfigId: body.metaInstagramConfigId || null,
            mlClientId: body.mlClientId || null,
            mapboxToken: body.mapboxToken || null
        };

        // Campos sensíveis: só sobrescreve se o admin realmente digitou um
        // valor novo e não vazio. Deixar em branco = "manter o que já está
        // salvo" (o GET nunca devolve o valor real, então o campo sempre
        // chega vazio a menos que tenha sido editado agora).
        for (const field of SENSITIVE_FIELDS) {
            const value = typeof body[field] === 'string' ? body[field].trim() : '';
            if (value) {
                updatePayload[field] = value;
            }
        }

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
        return NextResponse.json(sanitizeConfig(config));
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
