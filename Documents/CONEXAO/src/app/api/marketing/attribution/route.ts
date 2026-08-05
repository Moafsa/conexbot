import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { MetaAdsService } from "@/services/marketing/meta-ads-service";
import { GoogleAdsService } from "@/services/marketing/google-ads-service";

type Row = {
    key: string;
    campaignId: string | null;
    campaignName: string | null;
    utmSource: string | null;
    entrySource: string | null;
    leads: number;
    conversations: number;
    orders: number;
    revenue: number;
    spend: number;
    cpl: number | null;
    roas: number | null;
};

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 365);

        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const since = new Date();
        since.setDate(since.getDate() - days);

        const [contacts, conversations, snapshots] = await Promise.all([
            prisma.contact.findMany({
                where: {
                    tenantId,
                    createdAt: { gte: since },
                    OR: [{ campaignId: { not: null } }, { utmSource: { not: null } }]
                },
                select: {
                    id: true,
                    campaignId: true,
                    campaignName: true,
                    utmSource: true,
                    entrySource: true,
                    orders: { select: { totalAmount: true, status: true } }
                }
            }),
            prisma.conversation.groupBy({
                by: ["campaignId", "utmSource"],
                where: {
                    bot: { tenantId },
                    createdAt: { gte: since },
                    OR: [{ campaignId: { not: null } }, { utmSource: { not: null } }]
                },
                _count: { id: true }
            }),
            prisma.adSpendSnapshot.groupBy({
                by: ["campaignId"],
                where: { tenantId, date: { gte: since } },
                _sum: { spend: true }
            })
        ]);

        const spendByCampaign: Record<string, number> = {};
        for (const s of snapshots) {
            spendByCampaign[s.campaignId] = s._sum.spend || 0;
        }

        // O histórico persistido só existe a partir de quando o cron de snapshot começou a rodar.
        // Para completar gastos de campanhas ainda dentro da janela viva das APIs (~30 dias),
        // usamos os totais ao vivo como fallback quando não há snapshot para a campanha.
        if (days <= 30) {
            const [metaInsights, googleCampaigns] = await Promise.all([
                MetaAdsService.getCampaignInsightsLast30d(tenantId).catch(() => []),
                GoogleAdsService.getCampaignInsights(tenantId).catch(() => [])
            ]);
            for (const c of metaInsights) {
                if (c.campaignId && !(c.campaignId in spendByCampaign) && c.spend > 0) {
                    spendByCampaign[c.campaignId] = c.spend;
                }
            }
            for (const c of googleCampaigns) {
                const id = c.campaign?.id ? String(c.campaign.id) : null;
                if (id && !(id in spendByCampaign)) {
                    const spend = Number(c.metrics?.cost_micros || 0) / 1000000;
                    if (spend > 0) spendByCampaign[id] = spend;
                }
            }
        }

        const byKey: Record<string, Row> = {};

        for (const c of contacts) {
            const key = c.campaignId || c.utmSource || "desconhecido";
            if (!byKey[key]) {
                byKey[key] = {
                    key,
                    campaignId: c.campaignId,
                    campaignName: c.campaignName,
                    utmSource: c.utmSource,
                    entrySource: c.entrySource,
                    leads: 0,
                    conversations: 0,
                    orders: 0,
                    revenue: 0,
                    spend: 0,
                    cpl: null,
                    roas: null
                };
            }
            byKey[key].leads += 1;
            for (const o of c.orders) {
                if (o.status === "CANCELLED") continue;
                byKey[key].orders += 1;
                byKey[key].revenue += o.totalAmount;
            }
        }

        for (const g of conversations) {
            const key = g.campaignId || g.utmSource || "desconhecido";
            if (!byKey[key]) {
                byKey[key] = {
                    key,
                    campaignId: g.campaignId,
                    campaignName: null,
                    utmSource: g.utmSource,
                    entrySource: null,
                    leads: 0,
                    conversations: 0,
                    orders: 0,
                    revenue: 0,
                    spend: 0,
                    cpl: null,
                    roas: null
                };
            }
            byKey[key].conversations += g._count.id;
        }

        const rows = Object.values(byKey)
            .map((r) => {
                const spend = r.campaignId ? spendByCampaign[r.campaignId] || 0 : 0;
                return {
                    ...r,
                    spend,
                    cpl: r.leads > 0 ? spend / r.leads : null,
                    roas: spend > 0 ? r.revenue / spend : null
                };
            })
            .sort((a, b) => b.revenue - a.revenue || b.leads - a.leads);

        const totals = rows.reduce(
            (acc, r) => ({
                leads: acc.leads + r.leads,
                conversations: acc.conversations + r.conversations,
                orders: acc.orders + r.orders,
                revenue: acc.revenue + r.revenue,
                spend: acc.spend + r.spend
            }),
            { leads: 0, conversations: 0, orders: 0, revenue: 0, spend: 0 }
        );

        return NextResponse.json({ rows, totals, days });
    } catch (error: any) {
        console.error("[Attribution] Erro:", error);
        return NextResponse.json({ error: "Erro ao buscar dados de atribuição" }, { status: 500 });
    }
}
