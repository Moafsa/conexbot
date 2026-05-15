import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MarketingIAService } from "@/services/marketing/marketing-ia-service";

export async function GET(req: Request) {
    try {
        const now = new Date();
        
        // 1. Buscar bots com automação ativa
        const bots = await prisma.bot.findMany({
            where: {
                marketingAutoGenerate: true,
                marketingFrequency: { not: "MANUAL" },
                marketingTopic: { not: null }
            }
        });

        const results = [];

        for (const bot of bots) {
            let shouldGenerate = false;
            const lastGen = bot.lastMarketingGeneration || new Date(0);
            const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);

            switch (bot.marketingFrequency) {
                case "HOURLY":
                    if (diffHours >= 1) shouldGenerate = true;
                    break;
                case "DAILY":
                    if (diffHours >= 24) shouldGenerate = true;
                    break;
                case "3X_WEEK":
                    if (diffHours >= 56) shouldGenerate = true;
                    break;
                case "WEEKLY":
                    if (diffHours >= 168) shouldGenerate = true;
                    break;
            }

            if (shouldGenerate) {
                try {
                    console.log(`[CronAutomation] Gerando lote para Bot: ${bot.name} (${bot.id})`);
                    
                    const posts = await MarketingIAService.generateBatchPosts({
                        tenantId: bot.tenantId,
                        botId: bot.id,
                        count: bot.marketingBatchSize || 1,
                        theme: bot.marketingTopic!,
                        tone: "Profissional",
                        platform: "Instagram"
                    });

                    // Atualizar última geração
                    await prisma.bot.update({
                        where: { id: bot.id },
                        data: { lastMarketingGeneration: now }
                    });

                    results.push({ botId: bot.id, botName: bot.name, generated: posts.length });
                } catch (err: any) {
                    console.error(`[CronAutomation] Erro no bot ${bot.id}:`, err.message);
                    results.push({ botId: bot.id, error: err.message });
                }
            }
        }

        return NextResponse.json({ 
            processed: bots.length, 
            triggered: results.length,
            results 
        });
    } catch (error: any) {
        console.error("[CronAutomation] Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
