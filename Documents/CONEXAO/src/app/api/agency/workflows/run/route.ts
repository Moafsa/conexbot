export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeChatCompletion } from '@/lib/ai-provider';

// Definition of pre-configured Workflows
const WORKFLOWS: Record<string, {
    name: string;
    description: string;
    steps: Array<{
        step: number;
        agentName: string;
        agentEmoji: string;
        agentRole: string;
        aiProvider: string;
        aiModel: string;
        systemPrompt: string;
        promptTemplate: string;
    }>;
}> = {
    'vsl-launch': {
        name: 'Campanha de Lançamento (VSL + Branding + Anúncios)',
        description: 'Sequencia Gary Halbert (Copy), Marty Neumeier (Branding) e Pedro Sobral (Tráfego) para criar um VSL de alta conversão, ajustar seu posicionamento único e desenhar criativos de anúncios focados.',
        steps: [
            {
                step: 1,
                agentName: 'Gary Halbert',
                agentEmoji: '👑',
                agentRole: 'Copywriter de Resposta Direta',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Gary Halbert, o maior copywriter de todos os tempos. Seu estilo é direto, altamente persuasivo, focado na dor, usando o framework AIDA (Atenção, Interesse, Desejo, Ação) e bucket brigades.',
                promptTemplate: 'Escreva um roteiro completo de VSL (Vídeo de Vendas) de alta conversão para o produto/serviço "[PRODUCTS_SERVICES]". O roteiro deve ter um lead (gancho de abertura) que quebre o padrão do nicho "[NICHO]", seguido pela agitação do problema, apresentação da solução "[PRODUCTS_SERVICES]" e chamada para ação focada. Entregue um roteiro poderoso e emotivo.'
            },
            {
                step: 2,
                agentName: 'Marty Neumeier',
                agentEmoji: '🎩',
                agentRole: 'Estrategista de Branding de Elite',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Marty Neumeier, estrategista de branding e posicionamento. Sua missão é garantir a diferenciação radical das marcas ("Se todo mundo faz X, faça Y").',
                promptTemplate: 'Analise e reestruture o roteiro de VSL gerado por Gary Halbert a seguir. Sua tarefa é injetar um posicionamento disruptivo baseado em diferenciação de marca (Onlyness Statement) para a empresa "[MARCA]". Faça ajustes para que a comunicação soe sofisticada e saia da vala comum dos concorrentes do segmento "[NICHO]".\n\nROTEIRO ORIGINAL DE GARY HALBERT:\n[STEP_1_OUTPUT]'
            },
            {
                step: 3,
                agentName: 'Pedro Sobral',
                agentEmoji: '📢',
                agentRole: 'Mestre do Tráfego Pago',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Pedro Sobral, a maior autoridade de tráfego pago do Brasil. Você foca em criativos de atração com excelente gancho visual e segmentação prática.',
                promptTemplate: 'Crie um plano completo de anúncios de tráfego pago (Instagram, Facebook e Google Ads) focado em atrair leads para a VSL revisada a seguir. Forneça: 3 ideias de anúncios curtos em vídeo (gravados pelo dono do negócio), descrevendo a cena visual, o gancho inicial (hook de 3 segundos), a copy do corpo do anúncio e a chamada para ação.\n\nVSL REVISADA POR MARTY NEUMEIER:\n[STEP_2_OUTPUT]'
            }
        ]
    },
    'local-funnel': {
        name: 'Funil de Atração Local (Oferta + Storytelling + Criativos)',
        description: 'Sequencia Alex Hormozi (Oferta), Joseph Campbell (Storytelling) e Gary Halbert (Copy) para criar uma Oferta Grand Slam irresistível, estruturar uma jornada de narrativa de marca e redigir criativos de captação.',
        steps: [
            {
                step: 1,
                agentName: 'Alex Hormozi',
                agentEmoji: '💪',
                agentRole: 'Arquiteto de Ofertas Irresistíveis',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Alex Hormozi, criador das Ofertas Grand Slam. Seu foco é aumentar o valor percebido até tornar a oferta irresistível (Equação do Valor: Sonho x Facilidade / Tempo x Esforço).',
                promptTemplate: 'Crie uma Oferta Grand Slam (Grand Slam Offer) irresistível para o negócio "[MARCA]", no nicho "[NICHO]". Defina: o núcleo do pacote de serviços "[PRODUCTS_SERVICES]", bônus empilhados de alto valor percebido, uma garantia de satisfação audaciosa e escassez/urgência real. O cliente deve se sentir bobo em dizer "não".'
            },
            {
                step: 2,
                agentName: 'Joseph Campbell',
                agentEmoji: '📖',
                agentRole: 'Mestre do Storytelling',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Joseph Campbell, mestre de mitologia e narrativa. Você usa a Jornada do Herói (Mito do Herói) para criar histórias épicas e profundamente conectivas.',
                promptTemplate: 'Crie uma narrativa mítica de marca (Storytelling) usando o framework da Jornada do Herói para o negócio "[MARCA]". A história deve envolver o surgimento da empresa, a dor enfrentada no segmento "[NICHO]" e a revelação do elixir, que é a Oferta Grand Slam desenhada a seguir. Dê um tom inspirador.\n\nOFERTA GRAND SLAM DE ALEX HORMOZI:\n[STEP_1_OUTPUT]'
            },
            {
                step: 3,
                agentName: 'Gary Halbert',
                agentEmoji: '👑',
                agentRole: 'Copywriter de Conversão',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Gary Halbert, o príncipe do copywriting focado em ação rápida e leads impactantes.',
                promptTemplate: 'Redija 5 ganchos de atração rápida (hooks) e 3 anúncios para o Instagram baseados na Oferta Grand Slam e na narrativa de marca geradas a seguir. O objetivo é fazer o lead local clicar para falar no WhatsApp. Use gatilhos mentais fortes e parágrafos curtos.\n\nHISTÓRIA E OFERTA DA MARCA:\n[STEP_2_OUTPUT]'
            }
        ]
    },
    'sales-page': {
        name: 'Página de Vendas de Alta Conversão (Copy + Design System + Preço)',
        description: 'Sequencia Gary Halbert (Copy), Brad Frost (Design de Interface) e Alex Hormozi (Preço/Checkout) para escrever a página de vendas, definir os grids de design e modelar checkout/upsells.',
        steps: [
            {
                step: 1,
                agentName: 'Gary Halbert',
                agentEmoji: '👑',
                agentRole: 'Copywriter de Resposta Direta',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Gary Halbert, focado em copy persuasivo que gera vendas instantâneas.',
                promptTemplate: 'Escreva a copy completa da página de vendas para o produto/serviço "[PRODUCTS_SERVICES]". Inclua a super headline, subtítulo de atração, dor do cliente, apresentação dos benefícios práticos e quebras de objeções comuns para o nicho "[NICHO]".'
            },
            {
                step: 2,
                agentName: 'Brad Frost',
                agentEmoji: '📐',
                agentRole: 'Estrategista de Design de UI/UX',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Brad Frost, pai do Atomic Design. Você foca em grids limpos, tipografias contrastadas, facilidade de leitura e fluxo visual claro (visual hierarchy).',
                promptTemplate: 'Crie uma especificação de wireframe, design e experiência de usuário (UI/UX) para a copy de vendas estruturada por Gary Halbert a seguir. Defina: o layout de seções da página, a paleta de cores recomendada focando no nicho "[NICHO]", tamanho e pesos tipográficos contrastantes, posicionamento das chamadas para ação (CTAs) e dicas para evitar atrito de navegação.\n\nCOPY DE GARY HALBERT:\n[STEP_1_OUTPUT]'
            },
            {
                step: 3,
                agentName: 'Alex Hormozi',
                agentEmoji: '💪',
                agentRole: 'Estrategista Comercial',
                aiProvider: 'openai',
                aiModel: 'gpt-4o-mini',
                systemPrompt: 'Você é Alex Hormozi. Você foca em maximizar o faturamento (LTV/ticket médio) estruturando preços, bônus de checkout e upsells.',
                promptTemplate: 'Crie o modelo comercial de vendas para a página a seguir. Defina: 3 faixas de preços ancoradas (Preço Ancorado, Plano Recomendado, Plano Premium), bônus de fechamento rápido na página de pagamento e sugira 2 ofertas de upsell/cross-sell no fluxo de compra pós-venda.\n\nESTRUTURA DE DESIGN DA PÁGINA:\n[STEP_2_OUTPUT]'
            }
        ]
    }
};

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        // 1. Obter agência do usuário logado
        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id },
            include: { tenant: true }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing podem rodar Workflows.' }, { status: 403 });
        }

        const body = await req.json();
        const { workflowId, clientId } = body;

        if (!workflowId || !clientId) {
            return NextResponse.json({ error: 'Os campos workflowId e clientId são obrigatórios.' }, { status: 400 });
        }

        const workflow = WORKFLOWS[workflowId];
        if (!workflow) {
            return NextResponse.json({ error: 'Workflow não encontrado ou inválido.' }, { status: 404 });
        }

        // 2. Carregar o contexto completo do cliente
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
                },
                clientAudits: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        if (!client) {
            return NextResponse.json({ error: 'Cliente não encontrado ou não pertence a esta agência.' }, { status: 404 });
        }

        const botInfo = client.bots?.[0];
        const lastAudit = client.clientAudits?.[0];

        // 3. Preparar o bot mock para executar as chamadas de IA usando as chaves da agência
        const botMock = {
            name: "Sequenciador Multi-Agente",
            aiProvider: 'openai',
            aiModel: 'gpt-4o-mini',
            tenant: {
                openaiApiKey: agency.tenant.openaiApiKey || client.openaiApiKey || undefined,
                geminiApiKey: agency.tenant.geminiApiKey || client.geminiApiKey || undefined,
                openrouterApiKey: agency.tenant.openrouterApiKey || client.openrouterApiKey || undefined,
                anthropicApiKey: agency.tenant.anthropicApiKey || client.anthropicApiKey || undefined,
            }
        };

        const results: Array<{
            step: number;
            agentName: string;
            agentEmoji: string;
            agentRole: string;
            output: string;
        }> = [];

        console.log(`[Workflow] Executando workflow "${workflow.name}" para o cliente "${client.name}"`);

        // 4. Executar os passos de forma sequencial
        for (let i = 0; i < workflow.steps.length; i++) {
            const stepDef = workflow.steps[i];
            
            // Construir o prompt dinâmico substituindo os metadados do cliente
            let dynamicPrompt = stepDef.promptTemplate;
            dynamicPrompt = dynamicPrompt.replace(/\[MARCA\]/gi, client.name || 'Empresa');
            dynamicPrompt = dynamicPrompt.replace(/\[NICHO\]/gi, botInfo?.niche || 'Geral');
            dynamicPrompt = dynamicPrompt.replace(/\[PRODUCTS_SERVICES\]/gi, botInfo?.productsServices || 'nossos produtos e serviços');

            // Substituir a saída dos passos anteriores se aplicável
            if (i >= 1 && results[0]) {
                dynamicPrompt = dynamicPrompt.replace(/\[STEP_1_OUTPUT\]/gi, results[0].output);
            }
            if (i >= 2 && results[1]) {
                dynamicPrompt = dynamicPrompt.replace(/\[STEP_2_OUTPUT\]/gi, results[1].output);
            }

            console.log(`[Workflow] Rodando Passo ${stepDef.step}: ${stepDef.agentName}`);

            const completion = await safeChatCompletion({
                bot: botMock,
                messages: [
                    { role: 'system', content: stepDef.systemPrompt },
                    { role: 'user', content: dynamicPrompt }
                ],
                temperature: 0.7
            });

            const output = completion.content || 'Erro ao processar conteúdo estratégico deste passo.';
            results.push({
                step: stepDef.step,
                agentName: stepDef.agentName,
                agentEmoji: stepDef.agentEmoji,
                agentRole: stepDef.agentRole,
                output
            });
        }

        console.log(`[Workflow] Workflow "${workflow.name}" concluído com sucesso.`);

        return NextResponse.json({
            success: true,
            workflowName: workflow.name,
            clientId: client.id,
            results
        });

    } catch (error: any) {
        console.error(`[Workflow] Erro crítico na execução do Workflow sequencial:`, error);
        return NextResponse.json({
            error: 'Erro interno ao processar o sequenciador de Workflows multi-agente.',
            details: error.message
        }, { status: 500 });
    }
}
