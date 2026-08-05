import { prisma } from "@/lib/prisma";
import { MetaAdsService } from "./meta-ads-service";
import { GoogleAdsService } from "./google-ads-service";
import { logToFile } from "../engine/logger";

function todayUtcMidnight() {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

export const AdSpendTrackerService = {
    /**
     * Roda uma vez por dia (via cron) para todos os tenants com Meta/Google Ads configurado,
     * persistindo o gasto do dia por campanha. É isso que permite reportar ROI além da janela
     * rolante de ~30 dias que a Insights API expõe.
     */
    async captureAllSnapshots() {
        const tenants = await prisma.tenant.findMany({
            where: {
                OR: [
                    { AND: [{ metaAdsToken: { not: null } }, { metaAdsAccountId: { not: null } }] },
                    { AND: [{ googleAdsCustomerId: { not: null } }, { googleAdsRefreshToken: { not: null } }] }
                ]
            },
            select: { id: true }
        });

        let snapshots = 0;
        for (const tenant of tenants) {
            try {
                snapshots += await this.captureTenantSnapshot(tenant.id);
            } catch (error: any) {
                logToFile(`[AdSpendTracker] Falha ao capturar snapshot do tenant ${tenant.id}: ${error.message}`);
            }
        }

        return { tenants: tenants.length, snapshots };
    },

    async captureTenantSnapshot(tenantId: string) {
        const date = todayUtcMidnight();

        const [metaRows, googleRows] = await Promise.all([
            MetaAdsService.getCampaignSpendToday(tenantId).catch(() => []),
            GoogleAdsService.getCampaignSpendToday(tenantId).catch(() => [])
        ]);

        const rows = [
            ...metaRows.map((r: any) => ({ ...r, platform: "META" as const })),
            ...googleRows.map((r: any) => ({ ...r, platform: "GOOGLE" as const }))
        ];

        for (const r of rows) {
            await prisma.adSpendSnapshot.upsert({
                where: {
                    tenantId_campaignId_platform_date: {
                        tenantId,
                        campaignId: r.campaignId,
                        platform: r.platform,
                        date
                    }
                },
                update: {
                    spend: r.spend,
                    impressions: r.impressions,
                    clicks: r.clicks,
                    campaignName: r.campaignName
                },
                create: {
                    tenantId,
                    campaignId: r.campaignId,
                    campaignName: r.campaignName,
                    platform: r.platform,
                    date,
                    spend: r.spend,
                    impressions: r.impressions,
                    clicks: r.clicks
                }
            });
        }

        return rows.length;
    }
};
