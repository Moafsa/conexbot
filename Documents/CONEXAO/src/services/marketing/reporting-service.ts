import { prisma } from "@/lib/prisma";
import { MetaAdsService } from "./meta-ads-service";

export const ReportingService = {
    /**
     * Gera um resumo executivo do marketing para o tenant.
     */
    async generateSummary(tenantId: string) {
        const [posts, campaigns, adsInsights] = await Promise.all([
            prisma.marketingPost.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' }
            }),
            MetaAdsService.listCampaigns(tenantId),
            MetaAdsService.getInsights(tenantId)
        ]);

        const stats = {
            period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            totalPosts: posts.length,
            publishedPosts: posts.filter(p => p.status === 'PUBLISHED').length,
            activeCampaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
            totalSpend: adsInsights?.spend || 0,
            avgCtr: adsInsights?.inline_link_click_ctr || 0,
            impressions: adsInsights?.impressions || 0,
            clicks: adsInsights?.clicks || 0,
        };

        return {
            stats,
            campaigns: campaigns.map((c: any) => ({
                nome: c.name,
                status: c.status,
                objetivo: c.objective,
                orcamento: c.daily_budget ? (c.daily_budget / 100) : 0
            })),
            posts: posts.map(p => ({
                titulo: p.title || "Sem título",
                plataforma: p.platform,
                status: p.status,
                data: p.createdAt.toLocaleDateString('pt-BR')
            }))
        };
    }
};
