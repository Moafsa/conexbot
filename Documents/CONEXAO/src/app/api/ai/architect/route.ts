import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeChatCompletion } from '@/lib/ai-provider';
import { scrapeWebsite } from '@/services/engine/scraper';

// URL detection regex
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const tenant = await prisma.tenant.findUnique({
            where: { id: userId },
            select: {
                openaiApiKey: true,
                geminiApiKey: true,
                openrouterApiKey: true
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const { message, history, extractedTexts, botId } = await req.json();

        let botContext = "";
        if (botId) {
            const existingBot = await prisma.bot.findUnique({ where: { id: botId } });
            if (existingBot) {
                botContext = `\n\nESTADO ATUAL DO BOT (EDIÇÃO):
- Nome: ${existingBot.name}
- Tipo: ${existingBot.businessType}
- Descrição: ${existingBot.description}
- Personalidade Atual: ${existingBot.systemPrompt?.substring(0, 500)}...
`;
            }
        }

        console.log('[AI Architect] Received message:', message.substring(0, 100));

        const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });

        const effectiveTenant = {
            openaiApiKey: tenant.openaiApiKey || globalConfig?.openaiApiKey,
            geminiApiKey: tenant.geminiApiKey || globalConfig?.geminiApiKey,
            openrouterApiKey: tenant.openrouterApiKey
        };

        if (!effectiveTenant.openaiApiKey && !effectiveTenant.geminiApiKey && !effectiveTenant.openrouterApiKey) {
            return NextResponse.json({ error: 'AI Config is missing. Please contact administrator.' }, { status: 400 });
        }

        let provider = 'openai';
        if (!effectiveTenant.openaiApiKey) {
            if (effectiveTenant.geminiApiKey) provider = 'gemini';
            else if (effectiveTenant.openrouterApiKey) provider = 'openrouter';
        }

        const dummyBot = {
            aiProvider: provider,
            aiModel: provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini',
            tenant: effectiveTenant
        };

        // Detect URLs in message
        const urls = message.match(URL_REGEX);
        let scrapedContent = '';
        let websiteUrl = '';

        if (urls && urls.length > 0) {
            console.log('[AI Architect] Detected URLs:', urls);
            const url = urls[0];
            websiteUrl = url;

            const scrapeResult = await scrapeWebsite(url);
            if (scrapeResult.success) {
                scrapedContent = `\n\n===== CONTEÚDO RASPADO DO SITE ${url} =====\nTítulo: ${scrapeResult.title}\n\n${scrapeResult.content}\n===== FIM DO CONTEÚDO DO SITE =====\n`;
            } else {
                scrapedContent = `\n\n[Falha ao acessar ${url}: ${scrapeResult.error}]`;
            }
        }

        // Prepare context from files
        let filesContext = '';
        if (extractedTexts && extractedTexts.length > 0) {
            filesContext = extractedTexts.map((text: string, i: number) =>
                `\n\n===== CONTEÚDO EXTRAÍDO DO ARQUIVO ${i + 1} =====\n${text}\n===== FIM DO ARQUIVO ${i + 1} =====\n`
            ).join('');
        }

        const systemPrompt = `Você é o Arquiteto IA do Conext Bot.
OBJETIVO: Criar a configuração para o bot do usuário.

PROTOCOLO DE ENTREVISTA:
1. IDENTIDADE: Pergunte o Nome do agente.
2. NEGÓCIO: Pergunte Nome da Empresa e Tipo de negócio.
3. DESCRIÇÃO: Peça descrição do que vendem.
4. EXTRAÇÃO: 
   - Arquivos: Se houver arquivos, extraia dados.
   - Links: Se houver 'CONTEÚDO RASPADO' no contexto, USE-O como fonte de verdade. NÃO diga que não pode ler links. O sistema já leu para você.
5. RESUMO: Resuma antes de criar.
6. CRIAÇÃO (nextStep: done):
   - 🛑 CRÍTICO: VOCÊ ESTÁ PROIBIDO DE RETORNAR "done" SE O USUÁRIO NÃO DISSER EXPLICITAMENTE "PODE CRIAR", "CONFIRMO", "OK", "VAI".
   - Se o usuário apenas enviou informações, arquivos ou respondeu uma pergunta, CONTINUE em "details" e pergunte: "Posso criar o agente com essas informações?"
   - JAMAIS assuma que o usuário quer finalizar só porque ele parou de falar.
   - IMPRESCINDIVEL: Preencha extractedData.systemPrompt com a personalidade do bot no JSON final.

DIRETRIZES DE SEGURANÇA (ANTI-ALUCINAÇÃO):
- 🛑 PREÇOS: NUNCA invente preços. Se não estiver no texto, não cite valores. "10 mil" ou "10.000" só se estiver escrito EXPLICITAMENTE.
- NUNCA assuma que "9 dígitos" é um preço.
- Se estiver em dúvida sobre um valor, PERGUNTE ao usuário. Melhor perguntar do que inventar.

DIRETRIZES PARA 'extractedData.systemPrompt' (A PERSONALIDADE DO BOT):
- Deve ser UM TEXTO LONGO e DETALHADO (mínimo 3 parágrafos).
- Deve começar com: "Você é [Nome], especialista em [Descrição do Produto/Serviço] da [Empresa]."
- Deve conter a regra: "Responda APENAS sobre [Tópicos específicos do negócio]. Se perguntarem sobre outros assuntos, diga educadamente que não sabe."
- Deve incorporar TODAS as informações específicas fornecidas (preços, datas, locais, diferenciais).
- NUNCA crie um assistente genérico. Ele deve respirar a identidade da empresa definida.
- Se o usuário subiu arquivos ou links, use o conteúdo deles para enriquecer essa personalidade.

FORMATO JSON:
{ 
  "content": "Resposta",
  "nextStep": "name" | "business" | "description" | "details" | "done",
  "extractedData": { 
     "name": "Nome",
     "businessType": "Tipo", 
     "description": "Descricao",
     "systemPrompt": "INSTRUÇÕES_DE_PERSONALIDADE_DETALHADAS",
     "websiteUrl": "URL_DO_SITE_SE_HOUVER"
  }
}
`;

        // Combine user message with all contexts
        let detailedUserMessage = `Mensagem do usuário: "${message}"`;

        if (scrapedContent || filesContext) {
            detailedUserMessage += `\n\n--- INÍCIO DO CONTEXTO DO SISTEMA ---\n${scrapedContent}\n${filesContext}\n--- FIM DO CONTEÚDO ---\n\nIMPORTANTE: O sistema leu os links/arquivos acima para você. Use essas informações para responder ao usuário como se você mesmo tivesse lido.`;
        }

        const messages = [
            { role: "system", content: systemPrompt + (botContext ? `\n\n${botContext}` : "") },
            ...(history as any[]).map((msg: any) => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content })),
            { role: "user", content: detailedUserMessage }
        ];

        const aiResult = await safeChatCompletion({
            bot: dummyBot,
            messages: messages as any,
            response_format: { type: "json_object" },
            temperature: 0.1,
        }) as any;

        const responseContent = typeof aiResult === 'string' ? aiResult : aiResult.content;
        const parsedResponse = JSON.parse(responseContent || '{}');

        // 🛑 SAFETY: Prevent premature 'done'
        if (parsedResponse.nextStep === 'done') {
            const confirmationKeywords = ['pode', 'pode criar', 'ok', 'sim', 'beleza', 'confirmo', 'vai', 'isso', 'certo', 'manda ver', 'pode ser'];

            // Words that indicate the user is likely NOT confirming
            const doubtKeywords = ['espera', 'não', 'nao', 'ainda não', 'mudar', 'alterar', 'trocar', 'corrigir', 'errado', 'veja', 'olha'];

            const userMsgLower = message.toLowerCase();
            const hasConfirmation = confirmationKeywords.some(kw => userMsgLower.includes(kw));
            const hasDoubt = doubtKeywords.some(kw => userMsgLower.includes(kw));

            // If no confirmation found OR doubt found, force details step
            if (!hasConfirmation || hasDoubt) {
                console.log('[AI Architect] 🛑 Premature "done" detected or doubt found. Forcing user validation.');
                parsedResponse.nextStep = 'details';
                parsedResponse.content += " \n\n(Notei que você pode não ter confirmado explicitamente. Antes de eu criar, responda com **'Pode criar'** se estiver tudo certo, ou me peça para alterar algo!)";
            }
        }

        // Inject websiteUrl if known
        if (websiteUrl && parsedResponse.extractedData && !parsedResponse.extractedData.websiteUrl) {
            parsedResponse.extractedData.websiteUrl = websiteUrl;
        }

        // Auto-populate knowledgeBase for RAG
        if (parsedResponse.extractedData && !parsedResponse.extractedData.knowledgeBase) {
            const kbContent = [scrapedContent, filesContext].join('\n\n').trim();
            if (kbContent) {
                parsedResponse.extractedData.knowledgeBase = kbContent.substring(0, 10000);
            }
        }

        // Inject current provider/model for reference if needed
        if (parsedResponse.extractedData) {
            parsedResponse.extractedData.aiProvider = dummyBot.aiProvider;
            parsedResponse.extractedData.aiModel = dummyBot.aiModel;
        }

        return NextResponse.json(parsedResponse);
    } catch (error) {
        console.error('[AI Architect] Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
