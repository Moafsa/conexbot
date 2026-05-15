import { getAiClient } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";
import { logToFile } from "../engine/logger";
import { MarketingNotificationService } from "./notification-service";
import { StorageService } from "@/lib/storage";
import crypto from "crypto";
import { ImageCompositor } from "./image-compositor";

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
        baseImageUrls?: string[];
        videoUrl?: string | null;
    }) {
        const { tenantId, botId, theme, tone = "Profissional", platform = "Instagram", baseImageUrls = [], videoUrl = null } = params;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true }
        });

        if (!tenant) throw new Error("Tenant não encontrado");

        // 0. Buscar contexto do Bot (Base de Conhecimento)
        const bot = await prisma.bot.findUnique({
            where: { id: botId },
            select: { knowledgeBase: true, productsServices: true, businessType: true, name: true }
        });

        const botContext = bot ? `
        Contexto do Atendente (${bot.name}):
        - Tipo de Negócio: ${bot.businessType}
        - Produtos/Serviços: ${bot.productsServices}
        - Base de Conhecimento: ${bot.knowledgeBase}
        ` : "";

        // 1. Forçar OpenAI conforme solicitado pelo usuário
        const { client } = await getAiClient({ provider: "openai", tenant });

        // Converter URLs locais para base64 para a OpenAI não falhar com 400 (invalid_image_url)
        const processedImageUrls = await Promise.all(baseImageUrls.map(async (url) => {
            if (url.includes('localhost') || url.startsWith('/')) {
                try {
                    let fullUrl = url.startsWith('/') ? `http://127.0.0.1:3000${url}` : url;
                    fullUrl = fullUrl.replace('localhost:9002', 'conext-minio:9000').replace('localhost:3000', '127.0.0.1:3000');
                    const res = await fetch(fullUrl, { headers: { 'Connection': 'keep-alive' } });
                    if (!res.ok) return url;
                    const arrayBuffer = await res.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const mimeType = res.headers.get('content-type') || 'image/jpeg';
                    return `data:${mimeType};base64,${buffer.toString('base64')}`;
                } catch (e) {
                    console.error("[MarketingIA] Falha ao converter imagem local para base64", e);
                    return url;
                }
            }
            return url;
        }));

        // 2. Gerar Legenda e Prompt de Imagem Ultra-Realista
        const messages: any[] = [
            { 
                role: "user", 
                content: [
                    {
                        type: "text",
                        text: `Você é o Diretor de Estratégia de uma agência de marketing profissional.
                        Seu objetivo é criar um post estratégico para o ${platform} sobre o tema: "${theme}".
                        
                        CONTEXTO DO CLIENTE (Use isso como guia de estilo e fatos):
                        ${botContext}

                        REGRAS CRÍTICAS DE NEGÓCIO:
                        1. LEGENDA (caption): Deve ser escrita OBRIGATORIAMENTE em PORTUGUÊS, usando gatilhos mentais e o tom de voz "${tone}".
                        2. SEM ALUCINAÇÕES: Não invente datas, horários, locais ou nomes que não foram informados no tema ou no contexto acima. 
                        3. FOCO EM DADOS REAIS: Se o usuário não informou uma data, o design deve focar apenas no conceito e na marca.
                        
                        ESTRATÉGIA DE DESIGN (imagePrompt):
                        O prompt da imagem deve ser em INGLÊS e descrever um layout que:
                        - Use as informações REAIS fornecidas.
                        - Aplique design gráfico de alto nível (bold typography, clean layout).
                        - Se houver fotos de referência: Mantenha a identidade visual da pessoa/objeto fiel à realidade, integrando-a em um ambiente profissional de agência.
                        - MANDATÓRIO: Qualquer texto escrito DENTRO da imagem (Títulos, chamadas, nomes) deve ser escrito OBRIGATORIAMENTE em PORTUGUÊS (BRASIL).
                        
                        Responda APENAS em formato JSON:
                        {
                          "caption": "texto da legenda em PORTUGUÊS aqui",
                          "hashtags": ["tag1", "tag2"],
                          "imagePrompt": "prompt detalhado em inglês estritamente fiel aos fatos informados aqui"
                        }`
                    },
                    ...processedImageUrls.map(url => ({
                        type: "image_url",
                        image_url: { url }
                    }))
                ]
            }
        ];

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            response_format: { type: "json_object" }
        });

        const rawContent = completion.choices[0].message.content || "{}";
        const cleanJson = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let result: any = {};
        try {
            result = JSON.parse(cleanJson);
        } catch (e) {
            console.error("[MarketingIA] Erro ao fazer parse do JSON retornado:", rawContent);
            result = { caption: rawContent, hashtags: [], imagePrompt: theme };
        }

        // 3. Gerar Imagem com GPT Image 2 (Snapshot 2026-04-21)
        let finalImageUrl = null;
        
        if (videoUrl) {
            finalImageUrl = baseImageUrls[0] || null;
        } else {
            try {
                let baseAssetUrl = null;
                // Refinamos o prompt para garantir fotorrealismo e design de agência fiel aos fatos
                const professionalPrompt = `Professional advertising graphic design about: ${result.imagePrompt}. Use clean, modern layout. Cinematic lighting, high-end commercial photography, 8k. MANDATORY: Write all text on the image in Portuguese (Brazil). Ensure a polished, professional agency-grade finish.`;
                let imageBuffer: Buffer | null = null;

                if (baseImageUrls.length > 0) {
                    console.log("[MarketingIA] Usando API de Respostas para geração multimodal (High Fidelity)");
                    
                    const response = await (client as any).responses.create({
                        model: "gpt-5.5",
                        input: [
                            {
                                role: "user",
                                content: [
                                    { type: "input_text", text: professionalPrompt },
                                    ...processedImageUrls.map(url => ({
                                        type: "input_image",
                                        image_url: url
                                    }))
                                ]
                            }
                        ],
                        tools: [{ type: "image_generation", quality: "high", size: "1024x1024" }]
                    });

                    const imageData = response.output
                        .filter((o: any) => o.type === "image_generation_call")
                        .map((o: any) => o.result)[0];

                    if (imageData) {
                        imageBuffer = Buffer.from(imageData, 'base64');
                        const filename = `marketing/${tenantId}/${Date.now()}-ai.png`;
                        baseAssetUrl = await StorageService.uploadFile(imageBuffer, filename, "image/png");
                    }
                } else {
                    console.log("[MarketingIA] Usando API de Respostas para geração simples (High Fidelity)");
                    const response = await (client as any).responses.create({
                        model: "gpt-5.5",
                        input: [{ role: "user", content: [{ type: "input_text", text: professionalPrompt }] }],
                        tools: [{ type: "image_generation", quality: "high", size: "1024x1024" }]
                    });

                    const imageData = response.output
                        .filter((o: any) => o.type === "image_generation_call")
                        .map((o: any) => o.result)[0];

                    if (imageData) {
                        imageBuffer = Buffer.from(imageData, 'base64');
                        const filename = `marketing/${tenantId}/${Date.now()}-ai.png`;
                        baseAssetUrl = await StorageService.uploadFile(imageBuffer, filename, "image/png");
                    }
                }

                if (baseAssetUrl) {
                    console.log(`[MarketingIA] Imagem nativa gerada com sucesso: ${baseAssetUrl}`);
                    // BYPASS: Usamos a imagem direta da IA, sem o "compositor" antigo que estragava o design
                    finalImageUrl = baseAssetUrl;
                }
            } catch (e) {
                console.error("[MarketingIA] Erro crítico no fluxo de design:", e);
                finalImageUrl = baseImageUrls[0] || null;
            }
        }

        // 4. Persistir no Banco
        const safeHashtags = Array.isArray(result.hashtags) ? result.hashtags : [];
        const post = await prisma.marketingPost.create({
            data: {
                tenantId,
                botId,
                content: result.caption + (safeHashtags.length > 0 ? "\n\n" + safeHashtags.map((h: string) => `#${h}`).join(" ") : ""),
                imageUrl: finalImageUrl,
                videoUrl,
                mediaType: videoUrl ? "VIDEO" : "IMAGE",
                platform: platform.toUpperCase(),
                status: "DRAFT",
                shareToken: crypto.randomBytes(16).toString("hex")
            }
        });

        // 5. Notificar via WhatsApp (opcional, aqui estamos ativando por padrão para novos rascunhos)
        // Se for uma geração via CRON ou em lote, podemos querer disparar
        MarketingNotificationService.notifyPostGenerated(post.id);

        return post;
    },

    /**
     * Gera um lote de posts para automação.
     */
    async generateBatchPosts(params: {
        tenantId: string;
        botId: string;
        count: number;
        theme: string;
        tone?: string;
        platform?: string;
    }) {
        const variations = [
            "Foque em um benefício específico e único.",
            "Crie uma abordagem mais emocional e humana.",
            "Faça uma chamada para ação (CTA) agressiva e direta.",
            "Use uma curiosidade ou fato interessante sobre o tema.",
            "Apresente como se fosse uma dica exclusiva de um especialista.",
            "Crie um senso de urgência ou escassez.",
            "Abordagem focada em prova social e autoridade."
        ];

        const batchPromises = Array.from({ length: params.count }).map((_, i) => {
            const variation = variations[i % variations.length];
            const subTheme = `${params.theme}. Instrução adicional para esta variação: ${variation}`;
            return this.generatePost({ ...params, theme: subTheme });
        });

        const settledResults = await Promise.allSettled(batchPromises);
        const results = settledResults
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<any>).value);
            
        return results;
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

        let data: any = null;

        // 1. Tentar DataForSEO (Se configurado)
        if (tenant.dataForSeoApiKey) {
            try {
                console.log("[KeywordResearch] Usando DataForSEO para:", keyword);
                const { DataForSeoService } = require("./dataforseo-service");
                const results = await DataForSeoService.getSearchVolume(tenantId, [keyword]);
                if (results && results.length > 0) {
                    const res = results[0];
                    data = {
                        keyword: res.keyword,
                        volume: res.search_volume || 0,
                        difficulty: res.keyword_difficulty || 50,
                        cpc: res.cpc || 0,
                        intent: res.search_intent_info?.main_intent || "INFORMATIVA",
                        suggestions: [],
                        provider: "DATAFORSEO"
                    };
                }
            } catch (e) {
                console.error("[KeywordResearch] Erro DataForSEO:", e);
            }
        }

        // 2. Tentar Semrush (Se configurado e se DataForSEO falhou)
        if (!data && tenant.semrushApiKey) {
            try {
                console.log("[KeywordResearch] Usando Semrush para:", keyword);
                const { SemrushService } = require("./semrush-service");
                const res = await SemrushService.getKeywordData(tenantId, keyword);
                if (res) {
                    data = {
                        ...res,
                        intent: "COMERCIAL",
                        suggestions: [],
                        provider: "SEMRUSH"
                    };
                }
            } catch (e) {
                console.error("[KeywordResearch] Erro Semrush:", e);
            }
        }

        // 3. Complementar com IA Estratégica
        try {
            const { client, model } = await getAiClient({ 
                tenant, 
                provider: tenant.openaiApiKey ? "openai" : tenant.geminiApiKey ? "gemini" : "openai" 
            });

            const aiPrompt = `Você é um Engenheiro de SEO e Especialista em Marketing Digital Sênior.
            Analise a palavra-chave "${keyword}" e forneça uma análise estratégica detalhada para o mercado brasileiro.
            ${data ? `Dados já obtidos via ${data.provider}: Volume=${data.volume}, Dificuldade=${data.difficulty}, CPC=${data.cpc}. Use-os como base e enriqueça com sua estratégia.` : "Como você é uma IA de última geração, use seu conhecimento histórico e tendências para fornecer ESTIMATIVAS realistas."}

            Responda OBRIGATORIAMENTE em JSON:
            {
              "keyword": "${keyword}",
              "volume": ${data?.volume || 5000},
              "difficulty": ${data?.difficulty || 45},
              "cpc": ${data?.cpc || 1.50},
              "intent": "${data?.intent || "INFORMATIVA"}",
              "suggestions": [
                {"keyword": "sugestão 1", "volume": 1200, "difficulty": 20},
                {"keyword": "sugestão 2", "volume": 800, "difficulty": 15},
                {"keyword": "sugestão 3", "volume": 3500, "difficulty": 65}
              ],
              "topTopics": ["Tópico Relacionado 1", "Tópico Relacionado 2", "Tópico Relacionado 3"],
              "strategy": "Uma breve recomendação estratégica de conteúdo para dominar esta palavra-chave."
            }`;

            const completion = await client.chat.completions.create({
                model: model === "gpt-4o-mini" ? "gpt-4o-mini" : model,
                messages: [{ role: "user", content: aiPrompt }],
                response_format: { type: "json_object" }
            });

            const aiData = JSON.parse(completion.choices[0].message.content || "{}");
            
            if (!data) {
                data = { ...aiData, provider: "AI_STRATEGIC_ANALYSIS" };
            } else {
                // Mesclar dados reais com estratégia da IA
                data.strategy = aiData.strategy;
                data.topTopics = aiData.topTopics;
                data.suggestions = aiData.suggestions;
                data.intent = data.intent || aiData.intent;
            }
        } catch (error) {
            console.error("[MarketingIA] Erro na complementação com IA:", error);
            if (!data) {
                data = {
                    keyword,
                    volume: 1000,
                    difficulty: 50,
                    cpc: 1.00,
                    intent: "INFORMATIVA",
                    suggestions: [],
                    topTopics: [],
                    strategy: "Crie conteúdo relevante focado no usuário.",
                    provider: "SAFE_FALLBACK"
                };
            }
        }

        // Salvar no histórico para consulta futura
        await prisma.keywordResearch.create({
            data: {
                tenantId,
                keyword: data.keyword,
                volume: data.volume,
                difficulty: data.difficulty,
                cpc: data.cpc,
                provider: data.provider
            }
        });

        return data;
    },

    /**
     * Refina um post existente baseado em instruções do usuário.
     */
    async refinePost(params: {
        tenantId: string;
        postId: string;
        instructions: string;
    }) {
        const { tenantId, postId, instructions } = params;
        
        const post = await prisma.marketingPost.findUnique({
            where: { id: postId, tenantId },
            include: { bot: true }
        });

        if (!post) throw new Error("Post não encontrado");

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true }
        });

        const { client } = await getAiClient({ provider: "openai", tenant });

        const prompt = `Você é um Diretor de Arte Sênior. 
        O usuário deseja refinar um post já criado para ficar com qualidade premium.
        
        Legenda Atual: "${post.content}"
        Plataforma: ${post.platform}
        
        Instruções de Refinamento do Usuário: "${instructions}"
        
        Sua tarefa:
        1. Reescreva a legenda seguindo as instruções com alto impacto.
        2. Se as instruções mencionarem mudanças visuais, sugira um NOVO prompt de imagem (em inglês) ULTRA-DETALHADO.
        3. O prompt de imagem deve focar em: Hyper-realistic, professional commercial photography, high-end studio lighting, 8k resolution.
        
        Responda APENAS em formato JSON:
        {
          "caption": "nova legenda refinada aqui",
          "hashtags": ["tag1", "tag2"],
          "newImagePrompt": "prompt ultra-realista em INGLÊS focando nos detalhes visuais. IMPORTANTE: Todo texto visível na imagem deve ser em PORTUGUÊS (BRASIL)."
        }`;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        let newImageUrl = post.imageUrl;
        if (result.newImagePrompt) {
            try {
                console.log("[MarketingIA] Refinando imagem com API de Respostas (Multimodal)");
                
                // Se o post já tem uma imagem, usamos ela como referência para o refinamento
                const inputContent: any[] = [{ type: "input_text", text: result.newImagePrompt }];
                
                if (post.imageUrl) {
                    inputContent.push({
                        type: "input_image",
                        image_url: post.imageUrl
                    });
                }

                const response = await (client as any).responses.create({
                    model: "gpt-5.5",
                    input: [{ role: "user", content: inputContent }],
                    tools: [{ type: "image_generation", quality: "high", size: "1024x1024" }]
                });

                const imageData = response.output
                    .filter((o: any) => o.type === "image_generation_call")
                    .map((o: any) => o.result)[0];

                if (imageData) {
                    const buffer = Buffer.from(imageData, 'base64');
                    const filename = `marketing/${tenantId}/${Date.now()}-refined-ai.png`;
                    newImageUrl = await StorageService.uploadFile(buffer, filename, "image/png");
                }
            } catch (e) {
                console.error("[MarketingIA] Erro ao regerar imagem refinada:", e);
            }
        }

        const updatedPost = await prisma.marketingPost.update({
            where: { id: postId },
            data: {
                content: result.caption + (Array.isArray(result.hashtags) && result.hashtags.length > 0 ? "\n\n" + result.hashtags.map((h: string) => `#${h}`).join(" ") : ""),
                imageUrl: newImageUrl
            }
        });

        return updatedPost;
    },

    /**
     * Gera recomendações estratégicas dinâmicas baseadas em dados reais.
     */
    async generateRecommendations(tenantId: string) {
        try {
            const { MetaAdsService } = require("./meta-ads-service");
            
            // 1. Coleta de dados reais
            const [insights, keywordHistory, recentPosts] = await Promise.all([
                MetaAdsService.getInsights(tenantId).catch(() => null),
                prisma.keywordResearch.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
                prisma.marketingPost.findMany({ where: { tenantId, status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 5 })
            ]);

            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true }
            });

            const { client } = await getAiClient({ provider: "openai", tenant });

            const prompt = `Você é um Consultor de Marketing Digital de Performance.
            Analise os dados reais do cliente abaixo e sugira as 3 AÇÕES MAIS PRIORITÁRIAS para hoje.
            
            DADOS DE ANÚNCIOS (Meta Ads):
            ${insights ? JSON.stringify(insights) : "Nenhuma campanha ativa ou sem dados."}
            
            HISTÓRICO DE SEO (Keywords pesquisadas):
            ${keywordHistory.map(k => k.keyword).join(", ") || "Nenhuma pesquisa realizada ainda."}
            
            POSTS RECENTES:
            ${recentPosts.map(p => p.content.substring(0, 100)).join("\n---\n") || "Nenhum post publicado recentemente."}
            
            Sua tarefa é gerar 3 recomendações curtas e acionáveis.
            Responda APENAS em JSON:
            {
              "recommendations": [
                { "title": "Título Curto (ex: Impulsionar Post)", "desc": "Descrição estratégica baseada nos dados acima." },
                { "title": "Título Curto", "desc": "Descrição..." },
                { "title": "Título Curto", "desc": "Descrição..." }
              ]
            }`;

            const completion = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0].message.content || "{}");
            return result.recommendations || [];
        } catch (error) {
            console.error("[MarketingIA] Erro ao gerar recomendações:", error);
            // Fallback para não quebrar a UI
            return [
                { title: "Explorar Keywords", desc: "Use o explorador de palavras-chave para encontrar novas oportunidades de tráfego orgânico." },
                { title: "Aprovar Rascunhos", desc: "Existem posts aguardando sua revisão para serem publicados automaticamente." },
                { title: "Configurar Ads", desc: "Conecte sua conta da Meta Ads para receber insights de performance em tempo real." }
            ];
        }
    }
};
