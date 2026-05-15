import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UzapiService } from "@/services/engine/uzapi";
import { PhoneUtils } from "@/lib/phone-utils";
import bcrypt from "bcryptjs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = await params;
    const session = await getServerSession(authOptions) as any;
    
    console.log("[SendAccess] Session user:", JSON.stringify(session?.user));

    if (!session?.user) {
        console.error("[SendAccess] No session user found");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tenantId = session.user.id;
    if (!tenantId && session.user.email) {
        const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
        tenantId = t?.id;
    }

    console.log("[SendAccess] tenantId identified:", tenantId);

    const agency = await prisma.agency.findUnique({ 
        where: { tenantId: tenantId as string },
        include: { tenant: true }
    });

    if (!agency) {
        console.error("[SendAccess] User is not an agency. tenantId:", tenantId);
        return NextResponse.json({ error: "Not an agency" }, { status: 403 });
    }

    console.log("[SendAccess] Agency found:", agency.id);

    // 1. Look for an explicit "Dispatch Channel" (System Bot) for the agency
    // We identify it by businessType === 'SYSTEM_DISPATCH'
    const bots = await prisma.bot.findMany({
        where: { tenantId: tenantId as string }
    });

    console.log(`[SendAccess] Agency bots found: ${bots.length}`);
    
    // Prioridade 1: Bot de Sistema (Canal de Disparo) Conectado
    let bot = bots.find(b => b.businessType === 'SYSTEM_DISPATCH' && b.connectionStatus === 'CONNECTED');
    
    // Prioridade 2: Qualquer Bot Conectado (Fallback temporário enquanto o usuário não define o oficial)
    if (!bot) {
        bot = bots.find(b => b.connectionStatus === 'CONNECTED');
    }

    console.log(`[SendAccess] Selected bot: ${bot ? bot.name : 'NONE'}`);

    if (!clientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });
    
    const client = await prisma.tenant.findUnique({ where: { id: clientId } });

    if (!client || client.agencyId !== agency.id) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    if (!client.whatsapp) {
        return NextResponse.json({ error: "Cliente não possui WhatsApp cadastrado" }, { status: 400 });
    }

    console.log(`[SendAccess] tenantId: ${tenantId}, clientId: ${clientId}`);

    // Fallback: Se não houver um Canal de Disparo da Agência conectado, usamos o do SuperAdmin (Fallback Global)
    if (!bot) {
        console.log("[SendAccess] No agency dispatch bot connected. Falling back to SuperAdmin.");
        const superAdmin = await prisma.tenant.findFirst({
            where: { role: 'SUPERADMIN' }
        });

        if (superAdmin) {
            const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
            if (config?.systemBotId) {
                bot = await prisma.bot.findUnique({ where: { id: config.systemBotId } });
                console.log(`[SendAccess] Using SuperAdmin fallback bot: ${bot?.name}`);
            }
        }
    }
    // Generate a new temporary password for the client
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    try {
        // Update client password
        await prisma.tenant.update({
            where: { id: clientId },
            data: { password: hashedPassword }
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.conext.click";
        
        let whatsappSent = false;
        if (bot && bot.sessionName) {
            const normalizedPhone = PhoneUtils.normalize(client.whatsapp);
            const message = `*Olá, ${client.name}!* 🚀\n\nSeu acesso à plataforma *${agency.tenant?.name || 'Agência'}* foi configurado com sucesso.\n\nPara acessar seu painel, utilize os dados abaixo:\n\n🔗 *Link de Acesso:* ${appUrl}/auth/login\n📧 *E-mail:* ${client.email}\n🔑 *Senha Temporária:* ${tempPassword}\n\n_Recomendamos alterar sua senha após o primeiro acesso._`;
            
            console.log(`[SendAccess] Sending WhatsApp to ${normalizedPhone} (Original: ${client.whatsapp}) using bot ${bot.name}`);
            whatsappSent = await UzapiService.sendMessage(bot.sessionName, normalizedPhone, message);
        }

        return NextResponse.json({ 
            success: true, 
            tempPassword, 
            email: client.email,
            appUrl,
            whatsappSent,
            error: !bot ? "Nenhum canal de WhatsApp conectado para disparo automático, mas as credenciais foram geradas." : null
        });
    } catch (error) {
        console.error("Error sending access message:", error);
        return NextResponse.json({ error: "Erro interno ao processar envio" }, { status: 500 });
    }
}
