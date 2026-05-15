import { prisma } from "@/lib/prisma";
import { MarketingIAService } from "./marketing-ia-service";
import { logToFile } from "../engine/logger";

export const AdsSupervisorService = {
    /**
     * Função principal de otimização que roda via Cron.
     */
    async runOptimization() {
        logToFile("[AdsSupervisor] Iniciando rodada de otimização...");
        
        try {
            // 1. Buscar bots com otimização automática ativa
            const bots = await prisma.bot.findMany({
                where: {
                    adsAutoOptimize: true,
                    adsDailyBudget: { gt: 0 }
                },
                include: {
                    tenant: true
                }
            });

            logToFile(`[AdsSupervisor] Encontrados ${bots.length} bots para otimizar.`);

            for (const bot of bots) {
                await this.optimizeBotAds(bot);
            }

            return { processed: bots.length };
        } catch (error: any) {
            logToFile(`[AdsSupervisor] Erro crítico: ${error.message}`);
            throw error;
        }
    },

    /**
     * Analisa e otimiza os anúncios de um bot específico.
     */
    async optimizeBotAds(bot: any) {
        logToFile(`[AdsSupervisor] Analisando Bot: ${bot.name} (${bot.id})`);

        // 1. Verificar se já existe uma campanha ativa hoje para evitar duplicidade excessiva
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingCampaign = await prisma.marketingCampaign.findFirst({
            where: {
                botId: bot.id,
                createdAt: { gte: today },
                status: "ACTIVE"
            }
        });

        if (existingCampaign) {
            logToFile(`[AdsSupervisor] Já existe uma campanha ativa hoje para o bot ${bot.name}. Pulando...`);
            return;
        }

        // 2. Buscar o melhor post recente (Publicado e sem anúncio ativo)
        // Critério: Post mais recente que foi publicado e não tem metaAdId ainda
        const bestPost = await prisma.marketingPost.findFirst({
            where: {
                botId: bot.id,
                status: "PUBLISHED",
                metaAdId: null
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!bestPost) {
            logToFile(`[AdsSupervisor] Nenhum post novo disponível para impulsionar no bot ${bot.name}.`);
            return;
        }

        logToFile(`[AdsSupervisor] Selecionado Post ID ${bestPost.id} para impulsionamento automático.`);

        // 3. Criação de campanha na Meta (Real)
        const campaignName = `[AUTO] Otimização - ${bot.name} - ${new Date().toLocaleDateString()}`;
        
        try {
            const { MetaAdsService } = require("./meta-ads-service");
            const externalId = await MetaAdsService.createCampaign(bot.tenantId, {
                name: campaignName,
                objective: bot.adsObjective || "OUTREACH",
                dailyBudget: bot.adsDailyBudget * 100 // Meta usa centavos
            });

            // Criar registro da campanha no banco
            const campaign = await prisma.marketingCampaign.create({
                data: {
                    name: campaignName,
                    objective: bot.adsObjective || "ENGAGEMENT",
                    budget: bot.adsDailyBudget,
                    status: "ACTIVE",
                    botId: bot.id,
                    tenantId: bot.tenantId,
                    externalId: externalId
                }
            });

            // Atualizar o post com o ID da campanha/anúncio
            await prisma.marketingPost.update({
                where: { id: bestPost.id },
                data: { metaAdId: campaign.externalId }
            });

            // 4. Notificar o usuário
            await prisma.notification.create({
                data: {
                    tenantId: bot.tenantId,
                    type: "SUCCESS",
                    title: "🚀 Anúncio Automático Ativado",
                    content: `O Supervisor de Anúncios identificou um alto potencial no seu último post sobre "${bot.marketingTopic || 'seu negócio'}" e iniciou um impulsionamento diário de R$ ${bot.adsDailyBudget.toFixed(2)}.`
                }
            });

            logToFile(`[AdsSupervisor] Campanha criada com sucesso para o bot ${bot.name}.`);
        } catch (error: any) {
            logToFile(`[AdsSupervisor] Erro ao criar campanha para o bot ${bot.name}: ${error.message}`);
        }
    }
};
