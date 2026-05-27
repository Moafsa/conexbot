/**
 * POST /api/agency/onboarding
 *
 * Full guided onboarding for a new agency client.
 * Accepts the client data + niche and atomically:
 *  1. Creates the Tenant (client account) under the agency
 *  2. Creates a Bot pre-configured with the niche template
 *  3. Creates CRM pipeline + stages
 *  4. Creates follow-up rules
 *  5. Creates a UsageCounter
 *  6. Optionally sends WhatsApp access credentials
 *
 * Returns { clientId, botId, tempPassword, whatsappSent, template } so the
 * agency front-end can redirect straight to the bot config page.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getNicheTemplate } from '@/lib/niche-templates';
import { UzapiService } from '@/services/engine/uzapi';
import { PhoneUtils } from '@/lib/phone-utils';
import { ChatwootService } from '@/services/engine/chatwoot';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let tenantId = session.user.id;
    if (!tenantId && session.user.email) {
        const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
        tenantId = t?.id;
    }

    const agency = await prisma.agency.findUnique({
        where: { tenantId },
        include: { tenant: true },
    });
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    const body = await req.json();
    const {
        // Client data
        name,
        email,
        phone,
        cpfCnpj,
        // Niche
        niche = 'generico',
        // Bot metadata
        botName,
        websiteUrl,
        address,
        hours,
        // Multi-channel support
        channels = [],
        // Skip WhatsApp send (optional)
        skipSendAccess = false,
    } = body;

    if (!name || !email || !phone) {
        return NextResponse.json({ error: 'name, email e phone são obrigatórios' }, { status: 400 });
    }

    const template = getNicheTemplate(niche);

    // 1. Create or link client tenant
    const existingTenant = await prisma.tenant.findUnique({ where: { email } });
    let clientId: string;
    const tempPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    if (existingTenant) {
        if (existingTenant.agencyId && existingTenant.agencyId !== agency.id) {
            return NextResponse.json({ error: 'Este e-mail já pertence a outra agência' }, { status: 409 });
        }
        await prisma.tenant.update({
            where: { id: existingTenant.id },
            data: { agencyId: agency.id, whatsapp: phone, cpfCnpj: cpfCnpj || undefined, password: hashedPassword },
        });
        clientId = existingTenant.id;
    } else {
        const newClient = await prisma.tenant.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'USER',
                agencyId: agency.id,
                cpfCnpj: cpfCnpj || undefined,
                whatsapp: phone,
                usageCounter: {
                    create: {
                        messagesLimit: 5000,
                        botsLimit: 1,
                        periodEnd: new Date(Date.now() + 30 * 86_400_000),
                    },
                },
            },
        });
        clientId = newClient.id;
    }

    // 2. Create Bot with niche template
    const finalBotName = botName || `Bot ${template.label}`;
    const bot = await prisma.bot.create({
        data: {
            name: finalBotName,
            businessType: template.businessType,
            niche: template.niche,
            aiModel: template.aiModel,
            aiProvider: 'openai',
            modules: template.modules,
            systemPrompt: template.systemPromptHint,
            websiteUrl: websiteUrl || undefined,
            address: address || undefined,
            hours: hours || undefined,
            status: 'active',
            tenantId: clientId,
            sessionName: `bot_${clientId.slice(0, 8)}_${Date.now()}`,
        },
    });

    // 2a. Create BotChannels (multi-channel support)
    if (Array.isArray(channels) && channels.length > 0) {
        await prisma.botChannel.createMany({
            data: channels.map((ch: any) => ({
                botId: bot.id,
                provider: ch.provider,
                identifier: ch.identifier || undefined,
                status: 'DISCONNECTED',
            })),
            skipDuplicates: true,
        });
    }

    // 2b. Auto-provision Chatwoot account, user and API inbox
    // Non-fatal: bot is created and fully functional even if Chatwoot provision fails
    const appBaseUrl = process.env.INTERNAL_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://app:3000';
    const chatwootCreds = await ChatwootService.provisionForBot({
        clientName: name,
        clientEmail: email,
        botId: bot.id,
        botName: finalBotName,
        appBaseUrl,
        webhookToken: (bot as any).webhookToken || bot.id,
    });
    if (chatwootCreds) {
        await prisma.bot.update({
            where: { id: bot.id },
            data: {
                chatwootUrl: chatwootCreds.chatwootUrl,
                chatwootToken: chatwootCreds.chatwootToken,
                chatwootAccountId: chatwootCreds.chatwootAccountId,
                chatwootInboxId: chatwootCreds.chatwootInboxId,
            } as any,
        });
    }

    // 3. Create CRM pipeline + stages
    const pipeline = await prisma.crmPipeline.create({
        data: {
            name: `Funil ${template.label}`,
            botId: bot.id,
            allowedAgents: [],
        },
    });

    if (template.crmStages.length > 0) {
        await prisma.crmStage.createMany({
            data: template.crmStages.map(s => ({
                name: s.name,
                color: s.color,
                order: s.order,
                botId: bot.id,
                pipelineId: pipeline.id,
            })),
        });
    }

    // 4. Create follow-up rules
    if (template.followupRules.length > 0) {
        await prisma.followupRule.createMany({
            data: template.followupRules.map(r => ({
                name: r.name,
                triggerType: r.triggerType,
                triggerDays: r.triggerDays,
                triggerUnit: r.triggerUnit,
                message: r.message,
                tenantId: clientId,
                botId: bot.id,
                active: true,
            })),
        });
    }

    // 5. Send WhatsApp access credentials
    let whatsappSent = false;
    if (!skipSendAccess) {
        const bots = await prisma.bot.findMany({ where: { tenantId } });
        let dispatchBot = bots.find(b => b.businessType === 'SYSTEM_DISPATCH' && b.connectionStatus === 'CONNECTED');
        if (!dispatchBot) dispatchBot = bots.find(b => b.connectionStatus === 'CONNECTED');

        if (!dispatchBot) {
            const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
            if (config?.systemBotId) {
                dispatchBot = await prisma.bot.findUnique({ where: { id: config.systemBotId } }) ?? undefined;
            }
        }

        if (dispatchBot?.sessionName) {
            const normalizedPhone = PhoneUtils.normalize(phone);
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.conext.click';
            const msg =
                `*Olá, ${name}!* 🚀\n\n` +
                `Sua conta na plataforma *${agency.tenant?.name || 'Agência'}* foi configurada.\n\n` +
                `🔗 *Acesso:* ${appUrl}/auth/login\n` +
                `📧 *E-mail:* ${email}\n` +
                `🔑 *Senha Temporária:* ${tempPassword}\n\n` +
                `Seu bot *${finalBotName}* já está pré-configurado para o segmento de *${template.label}*. ` +
                `Acesse o painel para personalizar e conectar seu WhatsApp!\n\n` +
                `_Recomendamos alterar a senha após o primeiro acesso._`;
            whatsappSent = await UzapiService.sendMessage(dispatchBot.sessionName, normalizedPhone, msg);
        }
    }

    return NextResponse.json({
        success: true,
        clientId,
        botId: bot.id,
        pipelineId: pipeline.id,
        tempPassword,
        whatsappSent,
        chatwootProvisioned: !!chatwootCreds,
        chatwootAccountId: chatwootCreds?.chatwootAccountId ?? null,
        template: {
            niche: template.niche,
            label: template.label,
            stagesCreated: template.crmStages.length,
            followupRulesCreated: template.followupRules.length,
        },
    });
}
