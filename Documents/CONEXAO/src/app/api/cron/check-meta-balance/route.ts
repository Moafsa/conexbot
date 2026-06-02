import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MetaAdsService } from "@/services/marketing/meta-ads-service";
import { MarketingNotificationService as NotificationService } from "@/services/marketing/notification-service";

export async function GET(req: Request) {
    try {
        // Find all tenants that have a Meta Token configured
        const tenants = await prisma.tenant.findMany({
            where: {
                metaAdsToken: { not: null },
                metaAdsAccountId: { not: null }
            },
            select: { id: true, name: true, email: true, phone: true }
        });

        const results = [];

        for (const tenant of tenants) {
            try {
                const balanceInfo = await MetaAdsService.getAccountBalance(tenant.id);
                if (balanceInfo) {
                    const balance = balanceInfo.balance;
                    // Threshold: Alert if balance is below 50 BRL
                    if (balance < 50) {
                        const message = `⚠️ Alerta de Saldo Meta Ads: Olá ${tenant.name || 'Cliente'}, seu saldo de anúncios está baixo (R$ ${balance.toFixed(2)}). Recarregue sua conta para evitar a pausa de suas campanhas.`;
                        
                        // We use the notification service if available, or just log for now
                        if (NotificationService && NotificationService.sendWhatsAppAlert) {
                            await NotificationService.sendWhatsAppAlert(tenant.id, message).catch(console.error);
                        }

                        results.push({ tenantId: tenant.id, status: "LOW_BALANCE", balance: balance });
                    } else {
                        results.push({ tenantId: tenant.id, status: "OK", balance: balance });
                    }
                }
            } catch (err) {
                console.error(`Erro ao checar saldo do tenant ${tenant.id}`, err);
                results.push({ tenantId: tenant.id, status: "ERROR" });
            }
        }

        return NextResponse.json({ success: true, checked: tenants.length, results });
    } catch (error) {
        console.error("Cron Meta Balance Error:", error);
        return NextResponse.json({ error: "Erro interno no cron de saldo." }, { status: 500 });
    }
}
