import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const GoogleMeasurementService = {
    /**
     * Envia um evento de conversão para a API do Google Analytics 4 (Measurement Protocol).
     */
    async sendEvent(params: {
        tenantId: string;
        eventName: string; // Ex: 'generate_lead', 'purchase'
        userData: {
            email?: string;
            phone?: string;
            clientId?: string; // GA client_id (pode ser gerado a partir do telefone)
        };
        customData?: any;
    }) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: params.tenantId },
            select: { ga4MeasurementId: true, ga4ApiSecret: true }
        });

        if (!tenant?.ga4MeasurementId || !tenant?.ga4ApiSecret) {
            console.warn(`[GA4] Tenant ${params.tenantId} sem Measurement ID ou API Secret configurado.`);
            return;
        }

        const url = `https://www.google-analytics.com/mp/collect?measurement_id=${tenant.ga4MeasurementId}&api_secret=${tenant.ga4ApiSecret}`;
        
        // Se não tiver clientId (cookie _ga), criamos um hash determinístico do telefone/email para simular um clientId consistente
        let clientId = params.userData.clientId;
        if (!clientId) {
            const seed = params.userData.phone || params.userData.email || 'anonymous';
            clientId = crypto.createHash('md5').update(seed).digest('hex');
        }

        const payload = {
            client_id: clientId,
            events: [
                {
                    name: params.eventName,
                    params: {
                        ...params.customData,
                    }
                }
            ],
            // user_data é usado para Enhanced Conversions se a conta GA4 estiver linkada ao Ads
            user_data: {
                email_address: params.userData.email ? params.userData.email.trim().toLowerCase() : undefined,
                phone_number: params.userData.phone ? `+${params.userData.phone.replace(/\D/g, '')}` : undefined,
            }
        };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            // O Measurement Protocol retorna 204 No Content se sucesso.
            if (!res.ok) {
                const errorText = await res.text();
                console.error("[GA4] Erro ao enviar evento:", res.status, errorText);
                return null;
            }

            return { success: true };
        } catch (error) {
            console.error("[GA4] Error sending event:", error);
            return null;
        }
    }
};
