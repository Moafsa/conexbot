import { prisma } from "@/lib/prisma";
import { MetaAdsService } from "./meta-ads-service";
import { GoogleAdsService } from "./google-ads-service";
export const ReportingService = {
    /**
     * Gera um resumo executivo do marketing para o tenant consolidando Meta Ads e Google Ads.
     */
    async generateSummary(tenantId: string) {
        const [posts, metaCampaigns, metaInsights, googleCampaigns] = await Promise.all([
            prisma.marketingPost.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' }
            }),
            MetaAdsService.listCampaigns(tenantId).catch(() => []),
            MetaAdsService.getInsights(tenantId).catch(() => null),
            GoogleAdsService.getCampaignInsights(tenantId).catch(() => [])
        ]);

        // Trata Campanhas do Google para formato padronizado (ou mantém array separado)
        const parsedGoogleCampaigns = (googleCampaigns || []).map((c: any) => ({
            id: c.campaign?.id,
            nome: c.campaign?.name,
            status: c.campaign?.status,
            objetivo: 'SEARCH', // Padrão
            orcamento: 0, // A API simples de search não traz budget diretamente se não fizer join. Mantém 0.
            impressions: c.metrics?.impressions || 0,
            clicks: c.metrics?.clicks || 0,
            spend: c.metrics?.cost_micros ? (c.metrics.cost_micros / 1000000) : 0,
            plataforma: 'google'
        }));

        const parsedMetaCampaigns = (metaCampaigns || []).map((c: any) => ({
            id: c.id,
            nome: c.name,
            status: c.status,
            objetivo: c.objective,
            orcamento: c.daily_budget ? (c.daily_budget / 100) : 0,
            plataforma: 'meta'
        }));

        const allCampaigns = [...parsedMetaCampaigns, ...parsedGoogleCampaigns];

        // Consolida métricas
        const googleTotalSpend = parsedGoogleCampaigns.reduce((acc: number, cur: any) => acc + cur.spend, 0);
        const googleTotalImpressions = parsedGoogleCampaigns.reduce((acc: number, cur: any) => acc + Number(cur.impressions), 0);
        const googleTotalClicks = parsedGoogleCampaigns.reduce((acc: number, cur: any) => acc + Number(cur.clicks), 0);
        const googleAvgCtr = googleTotalImpressions > 0 ? ((googleTotalClicks / googleTotalImpressions) * 100) : 0;

        const totalSpend = (metaInsights?.spend || 0) + googleTotalSpend;
        const totalImpressions = (metaInsights?.impressions || 0) + googleTotalImpressions;
        const totalClicks = (metaInsights?.clicks || 0) + googleTotalClicks;
        const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;

        const stats = {
            period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            totalPosts: posts.length,
            publishedPosts: posts.filter((p: any) => p.status === 'PUBLISHED').length,
            activeCampaigns: allCampaigns.filter((c: any) => c.status === 'ACTIVE' || c.status === 'ENABLED').length,
            totalSpend: totalSpend,
            avgCtr: avgCtr,
            impressions: totalImpressions,
            clicks: totalClicks,
        };

        return {
            stats,
            campaigns: allCampaigns,
            posts: posts.map((p: any) => ({
                titulo: p.title || "Sem título",
                plataforma: p.platform,
                status: p.status,
                data: p.createdAt.toLocaleDateString('pt-BR')
            }))
        };
    }
};
