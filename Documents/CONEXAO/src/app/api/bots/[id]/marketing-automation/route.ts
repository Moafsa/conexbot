import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const body = await req.json();
        const { 
            frequency, autoGenerate, batchSize, postInterval, topic,
            adsAutoOptimize, adsDailyBudget, adsObjective 
        } = body;

        // Verificar se o bot pertence ao tenant
        const botExists = await prisma.bot.findFirst({
            where: { id: id, tenantId: (session.user as any).id }
        });

        if (!botExists) return NextResponse.json({ error: "Bot não encontrado" }, { status: 404 });

        const bot = await prisma.bot.update({
            where: { id: id },
            data: {
                marketingFrequency: frequency,
                marketingAutoGenerate: autoGenerate,
                marketingBatchSize: Number(batchSize),
                marketingPostInterval: Number(postInterval),
                marketingTopic: topic,
                adsAutoOptimize: adsAutoOptimize,
                adsDailyBudget: Number(adsDailyBudget),
                adsObjective: adsObjective
            }
        });

        return NextResponse.json(bot);
    } catch (error: any) {
        console.error("[MarketingAutomation] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
