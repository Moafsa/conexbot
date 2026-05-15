import { prisma } from "@/lib/prisma";

export const DataForSeoService = {
    /**
     * Busca volume de busca e dados de SEO para palavras-chave específicas.
     */
    async getSearchVolume(tenantId: string, keywords: string[], locationName: string = "Brazil", languageName: string = "Portuguese") {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { dataForSeoApiKey: true }
        });

        if (!tenant?.dataForSeoApiKey) {
            throw new Error("DataForSEO API Key não configurada. Use o formato 'login:password'");
        }

        const auth = Buffer.from(tenant.dataForSeoApiKey).toString('base64');
        const url = 'https://api.dataforseo.com/v3/keywords_data/google/search_volume/live';

        const postData = [{
            keywords,
            location_name: locationName,
            language_name: languageName
        }];

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            const data = await res.json();

            if (data.status_code !== 20000) {
                console.error("[DataForSEO] API Error:", data.status_message);
                return null;
            }

            return data.tasks?.[0]?.result || null;
        } catch (error) {
            console.error("[DataForSEO] Fetch error:", error);
            return null;
        }
    },

    /**
     * Busca sugestões de palavras-chave baseadas em uma semente.
     */
    async getKeywordSuggestions(tenantId: string, keyword: string, locationName: string = "Brazil", languageName: string = "Portuguese") {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { dataForSeoApiKey: true }
        });

        if (!tenant?.dataForSeoApiKey) return null;

        const auth = Buffer.from(tenant.dataForSeoApiKey).toString('base64');
        const url = 'https://api.dataforseo.com/v3/keywords_data/google/keywords_for_keywords/live';

        const postData = [{
            keywords: [keyword],
            location_name: locationName,
            language_name: languageName,
            limit: 10
        }];

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            const data = await res.json();
            if (data.status_code !== 20000) return null;

            return data.tasks?.[0]?.result || null;
        } catch (error) {
            return null;
        }
    }
};
