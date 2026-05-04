import { prisma } from "@/lib/prisma";

export const MetaPostService = {
    /**
     * Publica um post (imagem + legenda) no Instagram.
     */
    async publishToInstagram(postId: string) {
        const post = await prisma.marketingPost.findUnique({
            where: { id: postId },
            include: { tenant: true }
        });

        if (!post || !post.imageUrl || !post.tenant.metaAdsToken) {
            throw new Error("Post incompleto ou token Meta não configurado.");
        }

        // 1. Criar Container de Mídia
        const igAccountId = "ME"; // O usuário deve ter vinculado o Instagram à Página
        // Idealmente, pegamos o ig_business_account_id salvo no Tenant ou BotChannel
        
        // Mocking the flow for now as we need the specific IG Account ID
        const igUserId = "YOUR_INSTAGRAM_BUSINESS_ID"; 

        const containerUrl = `https://graph.facebook.com/v22.0/${igUserId}/media`;
        const containerRes = await fetch(containerUrl, {
            method: "POST",
            body: new URLSearchParams({
                image_url: post.imageUrl,
                caption: post.content,
                access_token: post.tenant.metaAdsToken
            })
        });
        const containerData = await containerRes.json();
        
        if (containerData.error) throw new Error(containerData.error.message);

        const creationId = containerData.id;

        // 2. Publicar Container
        const publishUrl = `https://graph.facebook.com/v22.0/${igUserId}/media_publish`;
        const publishRes = await fetch(publishUrl, {
            method: "POST",
            body: new URLSearchParams({
                creation_id: creationId,
                access_token: post.tenant.metaAdsToken
            })
        });
        const publishData = await publishRes.json();

        if (publishData.error) throw new Error(publishData.error.message);

        // Salvar ID da mídia
        await prisma.marketingPost.update({
            where: { id: postId },
            data: { 
                status: "PUBLISHED", 
                publishedAt: new Date(),
                metaMediaId: publishData.id 
            }
        });

        return publishData.id;
    },

    /**
     * Impulsiona um post existente criando um anúncio.
     */
    async boostPost(params: {
        postId: string;
        dailyBudget: number; // Em centavos (ex: 5000 = R$ 50,00)
        adSetId?: string;    // Se não fornecido, criaremos um AdSet básico ou usaremos um padrão
    }) {
        const { postId, dailyBudget } = params;
        const post = await prisma.marketingPost.findUnique({
            where: { id: postId },
            include: { tenant: true }
        });

        if (!post || !post.metaMediaId || !post.tenant.metaAdsToken || !post.tenant.metaAdsAccountId) {
            throw new Error("Post precisa estar publicado para ser impulsionado.");
        }

        const accessToken = post.tenant.metaAdsToken;
        const accountId = post.tenant.metaAdsAccountId.startsWith('act_') ? post.tenant.metaAdsAccountId : `act_${post.tenant.metaAdsAccountId}`;

        // 1. Criar AdCreative baseado no post existente
        const creativeUrl = `https://graph.facebook.com/v22.0/${accountId}/adcreatives`;
        const creativeRes = await fetch(creativeUrl, {
            method: "POST",
            body: new URLSearchParams({
                object_story_id: post.metaMediaId, // ID do post orgânico
                access_token: accessToken
            })
        });
        const creativeData = await creativeRes.json();
        if (creativeData.error) throw new Error(creativeData.error.message);

        const creativeId = creativeData.id;

        // 2. Criar ou Obter AdSet (Simplificado: assumindo que existe um AdSet de "Impulsionamento" ou criando um)
        // Para este MVP, vamos apenas listar os AdSets e pegar o primeiro ativo, 
        // ou avisar que o usuário deve selecionar um.
        
        // 3. Criar o Anúncio (Ad)
        const adUrl = `https://graph.facebook.com/v22.0/${accountId}/ads`;
        const adRes = await fetch(adUrl, {
            method: "POST",
            body: new URLSearchParams({
                name: `Boost: ${post.title || 'Post Gerado'}`,
                adset_id: params.adSetId || "SELECT_AN_ADSET_ID",
                creative: JSON.stringify({ creative_id: creativeId }),
                status: "PAUSED", // Criar pausado por segurança
                access_token: accessToken
            })
        });
        const adData = await adRes.json();

        if (adData.error) throw new Error(adData.error.message);

        await prisma.marketingPost.update({
            where: { id: postId },
            data: { metaAdId: adData.id }
        });

        return adData.id;
    }
};
