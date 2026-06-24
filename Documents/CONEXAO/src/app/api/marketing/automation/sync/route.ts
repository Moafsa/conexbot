import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MarketingIAService } from "@/services/marketing/marketing-ia-service";
import { MetaAdsService } from "@/services/marketing/meta-ads-service";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { botId } = body; // Optional: Force sync for a specific bot

        const botsToSync = await prisma.bot.findMany({
            where: {
                status: "active",
                ...(botId ? { id: botId } : { OR: [{ adsAutoOptimize: true }, { marketingAutoGenerate: true }] })
            },
            include: { tenant: true }
        });

        const logs = [];

        for (const bot of botsToSync) {
            console.log(`[Maestro Sync] Analisando Bot: ${bot.name} (${bot.id})`);
            
            // 1. Marketing Auto Generate (Orgânico)
            if (bot.marketingAutoGenerate && bot.marketingTopic) {
                // Check if it's time to generate
                const lastGen = bot.lastMarketingGeneration?.getTime() || 0;
                const intervalMs = (bot.marketingPostInterval || 24) * 60 * 60 * 1000;
                
                if (Date.now() - lastGen >= intervalMs || body.force) {
                    try {
                        const post = await MarketingIAService.generatePost({
                            tenantId: bot.tenantId,
                            botId: bot.id,
                            theme: bot.marketingTopic,
                            postFormat: "SINGLE"
                        });
                        
                        await prisma.bot.update({
                            where: { id: bot.id },
                            data: { lastMarketingGeneration: new Date() }
                        });
                        
                        logs.push({ botId: bot.id, action: "GENERATE_POST", status: "SUCCESS", postId: post.id });
                    } catch (e: any) {
                        console.error(`[Maestro Sync] Erro ao gerar post para ${bot.name}:`, e);
                        logs.push({ botId: bot.id, action: "GENERATE_POST", status: "ERROR", error: e.message });
                    }
                }
            }

            // 2. Ads Auto Optimize (Tráfego Pago)
            if (bot.adsAutoOptimize) {
                try {
                    const insights = await MetaAdsService.getInsights(bot.tenantId);
                    
                    if (insights && insights.data && insights.data.length > 0) {
                        // The Maestro logic: Ask AI what to do with these insights
                        const recommendations = await MarketingIAService.generateRecommendations(bot.tenantId);
                        logs.push({ botId: bot.id, action: "ADS_OPTIMIZATION", status: "ANALYZED", recommendations });
                        
                        // FUTURE: Here the Maestro would actually call Meta API to pause/increase budget.
                        // For now, it generates the recommendation logs which the UI will display.
                    } else {
                        logs.push({ botId: bot.id, action: "ADS_OPTIMIZATION", status: "SKIPPED", reason: "No active campaigns found" });
                    }
                } catch (e: any) {
                    console.error(`[Maestro Sync] Erro na otimização de Ads para ${bot.name}:`, e);
                    logs.push({ botId: bot.id, action: "ADS_OPTIMIZATION", status: "ERROR", error: e.message });
                }
            }
        }

        return NextResponse.json({ success: true, synced: botsToSync.length, logs });
    } catch (error: any) {
        console.error("[API_MARKETING_SYNC] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
