import { NextResponse } from "next/server";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const tenantId = await getEffectiveTenantId();
        if (!tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        // 1. Buscar o post e o bot associado
        const post = await prisma.marketingPost.findFirst({
            where: { id, tenantId },
            include: { bot: true }
        });

        if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
        
        // 1.1 Validar se existem credenciais (Keys)
        const tenantSettings = await prisma.tenant.findUnique({
            where: { id: post.tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenantSettings?.metaAdsToken) {
            return NextResponse.json({ 
                error: "Credenciais da Meta (Instagram/Facebook) não configuradas para este cliente. Vá em Configurações > Integrações." 
            }, { status: 400 });
        }

        const intervalHours = post.bot.marketingPostInterval || 24;
        const now = new Date();

        // 2. Encontrar o último post agendado/publicado deste bot para calcular o próximo horário
        const lastPost = await prisma.marketingPost.findFirst({
            where: {
                botId: post.botId,
                status: { in: ["SCHEDULED", "PUBLISHED"] },
                scheduledAt: { not: null }
            },
            orderBy: { scheduledAt: "desc" }
        });

        let scheduledAt = new Date(now.getTime() + 1000 * 60); // Iniciar com +1 min do agora por padrão

        if (lastPost && lastPost.scheduledAt) {
            const nextSlot = new Date(lastPost.scheduledAt.getTime() + (intervalHours * 60 * 60 * 1000));
            if (nextSlot > now) {
                scheduledAt = nextSlot;
            }
        }

        // 3. Atualizar o post para SCHEDULED
        await prisma.marketingPost.update({
            where: { id },
            data: {
                status: "SCHEDULED",
                scheduledAt: scheduledAt
            }
        });

        return NextResponse.json({ 
            success: true, 
            status: "SCHEDULED",
            scheduledAt: scheduledAt.toISOString()
        });
    } catch (error: any) {
        console.error("[PostPublish] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
