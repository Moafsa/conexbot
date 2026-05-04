import { getAiClient } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";
import { logToFile } from "../engine/logger";

export const MarketingIAService = {
    /**
     * Gera um post completo (Legenda + Imagem) baseado em um tema.
     */
    async generatePost(params: {
        tenantId: string;
        botId: string;
        theme: string;
        tone?: string;
        platform?: string;
    }) {
        const { tenantId, botId, theme, tone = "Profissional", platform = "Instagram" } = params;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true }
        });

        if (!tenant) throw new Error("Tenant não encontrado");

        // 1. Obter Cliente de IA
        const { client, model } = await getAiClient({ tenant });

        // 2. Gerar Legenda
        const prompt = `Você é um especialista em social media marketing. 
        Crie um post para o ${platform} sobre o seguinte tema: "${theme}".
        O tom de voz deve ser: ${tone}.
        
        Inclua:
        1. Uma legenda persuasiva (copywriting de alto impacto).
        2. Hashtags relevantes.
        3. Uma sugestão curta de prompt para geração de imagem (em inglês) que descreva visualmente este post.
        
        Responda APENAS em formato JSON:
        {
          "caption": "texto aqui",
          "hashtags": ["tag1", "tag2"],
          "imagePrompt": "prompt em inglês aqui"
        }`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini", // Força um modelo bom para JSON
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        // 3. Gerar Imagem (DALL-E 3)
        // Nota: Somente se usar OpenAI diretamente. GeminiWrapper não suporta imagens.
        let imageUrl = null;
        if (tenant.openaiApiKey || process.env.OPENAI_API_KEY) {
            try {
                const imageRes = await client.images.generate({
                    model: "dall-e-3",
                    prompt: result.imagePrompt,
                    n: 1,
                    size: "1024x1024",
                });
                imageUrl = imageRes.data[0].url;
            } catch (e) {
                console.error("[MarketingIA] Erro ao gerar imagem:", e);
            }
        }

        // 4. Persistir no Banco
        const post = await prisma.marketingPost.create({
            data: {
                tenantId,
                botId,
                content: result.caption + "\n\n" + result.hashtags.map((h: string) => `#${h}`).join(" "),
                imageUrl,
                platform: platform.toUpperCase(),
                status: "DRAFT"
            }
        });

        return post;
    },

    /**
     * Pesquisa palavras-chave usando os provedores configurados.
     */
    async searchKeywords(params: {
        tenantId: string;
        keyword: string;
    }) {
        const { tenantId, keyword } = params;
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) throw new Error("Tenant não encontrado");

        // TODO: Implementar integrações reais (DataForSEO, Semrush, Google Ads)
        // Por enquanto, usaremos uma IA para simular dados de SEO baseados em conhecimento geral
        // se nenhuma chave estiver configurada.

        const { client } = await getAiClient({ tenant });
        const prompt = `Analise a palavra-chave "${keyword}" e forneça dados ESTIMADOS de SEO.
        Responda APENAS em JSON:
        {
          "keyword": "${keyword}",
          "volume": 5000,
          "difficulty": 45,
          "cpc": 1.50,
          "suggestions": ["keyword1", "keyword2"]
        }`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0].message.content || "{}");

        // Salvar no histórico
        await prisma.keywordResearch.create({
            data: {
                tenantId,
                keyword: data.keyword,
                volume: data.volume,
                difficulty: data.difficulty,
                cpc: data.cpc,
                provider: "AI_ESTIMATE"
            }
        });

        return data;
    }
};
