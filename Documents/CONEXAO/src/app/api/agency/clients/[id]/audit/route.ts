export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { scrapeWebsite } from '@/services/engine/scraper';
import { safeChatCompletion } from '@/lib/ai-provider';

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
        "Redes Sociais: [Análise de Mídias] Ausência de copy persuasiva na bio e nas legendas das postagens.",
        "Conversão: Falta de provas sociais visíveis acima da dobra do site."
      ],
      "solutions": [
        "Website: [Dica Técnica] Substituir a headline por uma promessa forte com prazo definido e foco no benefício.",
        "Redes Sociais: [Ideia de Conteúdo] Criar posts de prova social no formato AIDA (Atenção, Interesse, Desejo, Ação).",
        "Copy/Ação: Implementar uma seção estruturada de perguntas frequentes (FAQ) quebrando as 5 maiores objeções de compra."
      ]
    },
    "brand": {
      "problems": [
        "Website: Identidade visual desalinhada com a sofisticação do nicho e tipografia de difícil leitura.",
        "Redes Sociais: Falta de consistência nos posts orgânicos, gerando confusão de posicionamento de marca.",
        "Diferenciação: O negócio se comunica como 'mais um no mercado' em vez de ser uma categoria única."
      ],
      "solutions": [
        "Website: [Ajuste de Design] Adotar paleta de cores moderna com contraste adequado nas chamadas para ação.",
        "Redes Sociais: [Identidade] Definir um grid fixo de conteúdo e padrão tipográfico nas postagens do Instagram/TikTok.",
        "Posicionamento: Definir o fator 'Único' da marca (Onlyness Statement) e destacá-lo logo na abertura do site."
      ]
    },
    "traffic": {
      "problems": [
        "Website: Sem pixel do Meta ou tag do Google Ads instalados, perdendo dados de visitantes para remarketing.",
        "Redes Sociais: Baixa frequência de publicações de criativos de atração e engajamento orgânico.",
        "Aquisição: Ausência de campanhas de tráfego pago ativas direcionando para conversão direta."
      ],
      "solutions": [
        "Website: [Tagging] Instalar e testar imediatamente a API de Conversões do Meta e o Google Tag Manager.",
        "Redes Sociais: [Ideias de Anúncios] Criar 3 anúncios de vídeo curtos apresentando o produto e direcionando para o WhatsApp.",
        "Tráfego/Ação: Disparar campanha de remarketing focando nos visitantes dos últimos 30 dias com oferta especial."
      ]
    },
    "data": {
      "problems": [
        "Website: Tempo de carregamento lento no mobile, aumentando a taxa de rejeição logo nos primeiros segundos.",
        "Redes Sociais: Links das bios quebrados ou sem rastreamento de parâmetros (UTM), impedindo saber de onde vêm os leads.",
        "SEO/Presença: Site mal indexado nos motores de busca (Google) e sem estrutura semântica apropriada (falta de tags H1/H2)."
      ],
      "solutions": [
        "Website: [SEO & Velocidade] Otimizar compressão das imagens do site e habilitar cache para carregamento ultrarrápido.",
        "Redes Sociais: [Tracking] Usar links rastreáveis com UTMs personalizadas na biografia do Instagram e botões do WhatsApp.",
        "Analytics/Leads: Configurar funil de metas no Google Analytics 4 para medir cliques no botão de conversão."
      ]
    },
    "strategy": {
      "problems": [
        "Website: A oferta atual é commoditizada e compete puramente por menor preço.",
        "Redes Sociais: Foco excessivo em postar apenas fotos de produtos sem criar relacionamento ou ofertar iscas digitais.",
        "Faturamento: Não há esteira de produtos estruturada (upsell/cross-sell) para aumentar o ticket médio por cliente."
      ],
      "solutions": [
        "Website: [Oferta Irresistível] Construir uma 'Oferta Grand Slam' juntando bônus de alto valor percebido e garantia de satisfação.",
        "Redes Sociais: [Isca Digital] Ofertar um material gratuito (e-book, checklist ou cupom exclusivo) para atrair leads frios.",
        "Esteira Comercial: Implementar um fluxo automático de upsell logo na página de checkout ou pós-venda via WhatsApp."
      ]
    }
  },
  "missions": [
    {
      "id": "mission-unique-id-1",
      "title": "Instalar o Meta Pixel no site",
      "description": "Adicione o código de rastreamento do Pixel do Facebook e Google Ads na head do website do cliente para iniciar o remarketing de visitantes.",
      "squad": "traffic",
      "priority": 1,
      "status": "PENDING"
    }
  ]
}
`;

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const clientId = params.id;

        // 1. Validar se o solicitante é uma agência e gerencia este cliente
        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id },
            include: { tenant: true }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing podem realizar auditorias.' }, { status: 403 });
        }

        const client = await prisma.tenant.findFirst({
            where: {
                id: clientId,
                agencyId: agency.id
            },
            include: {
                bots: {
                    include: {
                        channels: true
                    },
                    take: 1
                }
            }
        });

        if (!client) {
            return NextResponse.json({ error: 'Cliente não encontrado ou não pertence a esta agência.' }, { status: 404 });
        }

        // 2. Colocar na fila do BullMQ
        const { enqueueAudit } = await import('@/lib/queue');
        const jobId = await enqueueAudit({ clientId, agencyId: agency.id });

        return NextResponse.json({
            success: true,
            jobId,
            message: 'Auditoria enviada para processamento em background.'
        });

    } catch (error: any) {
        console.error(`[RaioX] Erro ao enviar Raio-X para fila:`, error);
        return NextResponse.json({ 
            error: 'Erro interno ao iniciar o Raio-X.', 
            details: error.message 
        }, { status: 500 });
    }
}
