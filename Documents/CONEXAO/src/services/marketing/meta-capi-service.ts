import { prisma } from "@/lib/prisma";

export const MetaCAPIService = {
    /**
     * Envia um evento de conversão para a API de Conversões da Meta (CAPI).
     */
    async sendEvent(params: {
        tenantId: string;
        eventName: "Lead" | "Purchase" | "Contact" | "CustomizeProduct" | "CompleteRegistration";
        userData: {
            email?: string;
            phone?: string;
            externalId?: string;
            fbc?: string; // Facebook Click ID
            fbp?: string; // Facebook Browser ID
        };
        customData?: any;
    }) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: params.tenantId },
            select: { metaAdsToken: true, metaAdsPixelId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsPixelId) {
            console.warn(`[CAPI] Tenant ${params.tenantId} sem Pixel/Token configurado.`);
            return;
        }

        const url = `https://graph.facebook.com/v22.0/${tenant.metaAdsPixelId}/events`;
        
        // Hashing de dados sensíveis (requisito da Meta)
        const hash = (val?: string) => val ? require('crypto').createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : undefined;

        const payload = {
            data: [
                {
                    event_name: params.eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: "chat",
                    user_data: {
                        em: [hash(params.userData.email)],
                        ph: [hash(params.userData.phone)],
                        external_id: [hash(params.userData.externalId)],
                        fbc: params.userData.fbc,
                        fbp: params.userData.fbp,
                    },
                    custom_data: params.customData,
                }
            ],
            access_token: tenant.metaAdsToken
        };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("[CAPI] Error sending event:", error);
        }
    }
};
