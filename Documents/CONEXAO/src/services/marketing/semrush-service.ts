import { prisma } from "@/lib/prisma";

export const SemrushService = {
    /**
     * Busca dados de palavra-chave na Semrush.
     */
    async getKeywordData(tenantId: string, keyword: string, database: string = "br") {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { semrushApiKey: true }
        });

        if (!tenant?.semrushApiKey) {
            throw new Error("Semrush API Key não configurada.");
        }

        const url = `https://api.semrush.com/?type=phrase_all&key=${tenant.semrushApiKey}&phrase=${encodeURIComponent(keyword)}&database=${database}&export_columns=Ph,Nq,Cp,Co,Kd`;

        try {
            const res = await fetch(url);
            const text = await res.text();

            if (text.startsWith("ERROR")) {
                console.error("[Semrush] API Error:", text);
                return null;
            }

            // Parse CSV (Simple implementation for one row)
            const lines = text.trim().split("\n");
            if (lines.length < 2) return null;

            const headers = lines[0].split(";");
            const values = lines[1].split(";");

            const result: any = {};
            headers.forEach((h, i) => {
                result[h] = values[i];
            });

            return {
                keyword: result.Ph,
                volume: parseInt(result.Nq) || 0,
                cpc: parseFloat(result.Cp) || 0,
                difficulty: parseInt(result.Kd) || 0,
                competition: parseFloat(result.Co) || 0
            };
        } catch (error) {
            console.error("[Semrush] Fetch error:", error);
            return null;
        }
    }
};
