import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { scrapeWebsite } from '@/services/engine/scraper';
import { safeChatCompletion } from '@/lib/ai-provider';
import { logger } from '@/lib/logger';
import { AuditJob } from '@/lib/queue';

const AUDIT_PROMPT = `Você é o Conselho Diretor da Agency Intelligence Hub, composto por 5 dos maiores especialistas do marketing mundial:
1. GARY HALBERT (Mestre do Copywriting e Redação Persuasiva)
2. MARTY NEUMEIER (Gênio de Branding, Posicionamento e Diferenciação)
3. PEDRO SOBRAL (Maior Autoridade em Gestão de Tráfego Pago e Distribuição)
4. SEAN ELLIS (Pai do Growth Hacking e Análise de Métricas/Dados)
5. ALEX HORMOZI (Estrategista de Ofertas de Alto Valor e Aquisição Irresistível)

Sua missão é realizar um diagnóstico profundo de 360 graus (Raio-X) do negócio descrito a seguir.
Você deve avaliar criticamente o Website oficial do cliente (estrutura, SEO, copy, velocidade/atratividade, CTAs) e sua Presença nas Redes Sociais declaradas (Instagram, Facebook, TikTok, etc., analisando consistência, engajamento, handles e fornecendo ideias práticas de postagens e vídeos).

O diagnóstico de cada especialista no JSON deve conter análises ricas e detalhadas, incluindo dicas acionáveis, hooks de vídeo, ideias de criativos e otimizações de funil de vendas.

Estruture a resposta nos 5 pilares do Conselho:
1. COPY SQUAD (Gary Halbert): Avaliação profunda da Headline do site, copy de conversão, promessa, quebra de objeções e persuasão nas redes sociais.
2. BRAND SQUAD (Marty Neumeier): Diagnóstico de posicionamento, consistência da identidade visual e comunicação entre o site e as redes sociais.
3. TRAFFIC MASTERS (Pedro Sobral): Auditoria de prontidão de tráfego, pixel tracking no site, e ideias de campanhas pagas para Instagram/Facebook/Google Ads.
4. DATA SQUAD (Sean Ellis): Diagnóstico técnico de conversão do site (SEO, atratividade e atrito de carregamento) e captação de leads.
5. HORMOZI SQUAD (Alex Hormozi): Oferta principal (Grand Slam Offer), propostas de valor irresistíveis, bônus e garantias para escalar o faturamento.

Você deve responder rigorosamente no formato de um objeto JSON estruturado contendo pontuações, análises e missões práticas de correção ordenadas por prioridade.

ATENÇÃO: Retorne APENAS o objeto JSON. Não coloque crases de markdown (\`\`\`), não coloque texto antes ou depois. Deve ser um JSON puro e perfeitamente parseável.

Estrutura do JSON de Resposta:
{
  "scores": {
    "copy": 85, // Score de 0 a 100
    "brand": 70,
    "traffic": 45,
    "data": 50,
    "strategy": 60
  },
  "overallScore": 62, // Média matemática inteira dos scores acima
  "report": {
    "copy": {
      "problems": [
        "Website: [Análise do Site] Headline fraca e sem foco na dor principal do cliente.",
        "Redes Sociais: [Análise de Mídias] Ausência de copy persuasiva na bio e nas legendas das postagens."
      ],
      "solutions": [
        "Website: [Dica Técnica] Substituir a headline por uma promessa forte com prazo definido e foco no benefício."
      ]
    }
  },
  "missions": [
    {
      "id": "mission-unique-id-1",
      "title": "Instalar o Meta Pixel no site",
      "description": "Adicione o código de rastreamento do Pixel do Facebook e Google Ads na head do website.",
      "squad": "traffic",
      "priority": 1,
      "status": "PENDING"
    }
  ]
}
`;

export async function processAuditJob(job: Job<AuditJob>) {
    const { clientId, agencyId } = job.data;
    
    logger.info({ jobId: job.id, clientId, agencyId }, '[AuditWorker] Iniciando processamento do Raio-X');

    try {
        const agency = await prisma.agency.findUnique({
            where: { id: agencyId },
            include: { tenant: true }
        });
        if (!agency) throw new Error('Agência não encontrada.');

        const client = await prisma.tenant.findFirst({
            where: { id: clientId, agencyId },
            include: {
                bots: {
                    include: { channels: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!client) throw new Error('Cliente não encontrado.');

        const botInfo = client.bots?.[0];
        const channelsList = botInfo?.channels || [];
        const socialChannels = channelsList.map(c => `[${c.provider.toUpperCase()}]: ${c.identifier || 'Não informado'}`).join('\n');

        let contentToAnalyze = `
Nome da Empresa: ${client.name}
Nicho de Negócio: ${botInfo?.niche || 'Não informado'}
Descrição de Onboarding: ${botInfo?.description || 'Não informada'}
Principais Produtos/Serviços: ${botInfo?.productsServices || 'Não informado'}
Diferenciais Informados: ${botInfo?.differentials || 'Não informados'}
Formas de Pagamento: ${Array.isArray(botInfo?.paymentMethods) ? botInfo?.paymentMethods.join(', ') : 'Não informado'}
Endereço: ${botInfo?.address || 'Não informado'}
Horários: ${botInfo?.hours || 'Não informado'}

CANAIS OPERACIONAIS E REDES SOCIAIS CONFIGURADAS:
${socialChannels || 'Nenhuma rede social/canal configurado no onboarding.'}
`;

        let scrapedText = '';
        let wasScraped = false;

        if (botInfo?.websiteUrl) {
            logger.info({ websiteUrl: botInfo.websiteUrl }, `[AuditWorker] Iniciando scraping do site do cliente`);
            try {
                const scrapeResult = await scrapeWebsite(botInfo.websiteUrl);
                if (scrapeResult.success && scrapeResult.content) {
                    scrapedText = scrapeResult.content.slice(0, 10000);
                    wasScraped = true;
                    logger.info(`[AuditWorker] Scraping concluído. Tamanho: ${scrapeResult.content.length}`);
                }
            } catch (err: any) {
                logger.error({ err }, `[AuditWorker] Falha ao fazer scrape do site: ${err.message}`);
            }
        }

        if (wasScraped) {
            contentToAnalyze += `\nCONTEÚDO RASPADO (SCRAPED) DO WEBSITE OFICIAL (${botInfo?.websiteUrl}):\n${scrapedText}\n`;
        } else {
            contentToAnalyze += `\n(Nota: Website oficial (${botInfo?.websiteUrl || 'Não informado'}) não respondeu ou não foi configurado. Diagnóstico do site gerado com base nos metadados de onboarding)\n`;
        }

        const botMock = {
            name: "Conselho Diretor de Auditoria",
            aiProvider: 'openai',
            aiModel: 'gpt-4o-mini',
            tenant: {
                openaiApiKey: agency.tenant.openaiApiKey || client.openaiApiKey || undefined,
                geminiApiKey: agency.tenant.geminiApiKey || client.geminiApiKey || undefined,
                openrouterApiKey: agency.tenant.openrouterApiKey || client.openrouterApiKey || undefined,
                anthropicApiKey: agency.tenant.anthropicApiKey || client.anthropicApiKey || undefined,
            }
        };

        logger.info(`[AuditWorker] Chamando LLM (Conselho de IAs) para auditoria`);

        const completion = await safeChatCompletion({
            bot: botMock,
            messages: [
                { role: 'system', content: AUDIT_PROMPT },
                { role: 'user', content: `DADOS DO CLIENTE PARA ANÁLISE:\n${contentToAnalyze}` }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        let parsedResult;
        try {
            parsedResult = JSON.parse(completion.content || '{}');
        } catch (e) {
            logger.error({ content: completion.content }, "[AuditWorker] Erro ao parsear JSON da auditoria");
            throw new Error("A IA não retornou um JSON de auditoria válido.");
        }

        const scores = parsedResult.scores || { copy: 50, brand: 50, traffic: 50, data: 50, strategy: 50 };
        const overallScore = parsedResult.overallScore || Math.round(Object.values(scores).reduce((a: any, b: any) => a + b, 0) / 5);
        const report = parsedResult.report || {};
        const missions = parsedResult.missions || [];

        const audit = await prisma.clientAudit.create({
            data: {
                id: job.id, // Víncula a id do job à id da auditoria para facilitar o status check
                clientId: client.id,
                agencyId: agency.id,
                scores: scores as any,
                report: report as any,
                missions: missions as any,
                overallScore: overallScore
            }
        });

        logger.info({ auditId: audit.id, overallScore }, `[AuditWorker] Auditoria finalizada com sucesso!`);
        return { auditId: audit.id, overallScore };

    } catch (error: any) {
        logger.error({ err: error, jobId: job.id }, `[AuditWorker] Erro crítico ao processar Raio-X: ${error.message}`);
        throw error;
    }
}
