import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { getAiClient } from "@/lib/ai-provider";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { name, niche, price, audience, transformation, botId } = body;

        if (!name || !niche || !price || !botId) {
            return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 });
        }

        // Buscar informações do bot e tenant para usar a API key configurada
        const bot = await prisma.bot.findUnique({
            where: { id: botId },
            include: {
                tenant: {
                    include: { managedBy: true }
                }
            }
        });

        if (!bot) {
            return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });
        }

        const tenant = bot.tenant;

        // Tentar obter o cliente de IA configurado para o bot/tenant (ex: openai ou gemini)
        const aiProvider = bot.aiProvider || "openai";
        const aiModel = bot.aiModel || "gpt-4o-mini";

        const { client, model } = await getAiClient({
            provider: aiProvider,
            model: aiModel,
            tenant: tenant as any
        });

        const prompt = `
Você é um copywriter de conversão extremamente experiente em infoprodutos e ofertas de baixo ticket (low ticket) no mercado brasileiro.
Sua tarefa é criar o copy de vendas para a landing page do seguinte produto digital:

Nome do Produto: ${name}
Nicho de Atuação: ${niche}
Preço de Venda: R$ ${price}
Público-Alvo: ${audience}
Principal Transformação: ${transformation}

Utilize técnicas avançadas de copywriting (benefícios, escassez, empilhamento de bônus, quebra de objeções e inversão de risco).
Seu retorno deve ser OBRIGATORIAMENTE um objeto JSON válido, sem markdown ou caracteres extras de formatação, com a seguinte estrutura:

{
  "headline": "HEADLINE PRINCIPAL CHAMATIVA (Máximo 15 palavras, toda em maiúsculas, foque no maior benefício/transformação)",
  "subheadline": "Subheadline curta que expande a promessa e quebra a principal objeção",
  "bullets": [
    "Benefício/recurso 1 com foco em transformação prática",
    "Benefício/recurso 2 explicando como economiza tempo ou esforço",
    "Benefício/recurso 3 mostrando facilidade de aplicação",
    "Benefício/recurso 4 resolvendo uma objeção comum de suporte",
    "Benefício/recurso 5 mostrando que qualquer um pode começar do zero"
  ],
  "scarcity": "Frase de urgência ou escassez para incentivar o clique imediato (ex: 'Preço promocional válido para as próximas vagas')",
  "bonuses": [
    { "title": "BÔNUS 1: [Nome do Bônus]", "description": "Como este bônus resolve o próximo problema do cliente de forma prática.", "value": "R$ 97,00" },
    { "title": "BÔNUS 2: [Nome do Bônus]", "description": "Uma ferramenta, template ou facilitação que poupa tempo do comprador.", "value": "R$ 147,00" },
    { "title": "BÔNUS 3: [Nome do Bônus]", "description": "Um guia de aceleração rápida para ver os primeiros resultados.", "value": "R$ 47,00" }
  ],
  "guarantee": "Texto de garantia incondicional e inversão de risco (ex: 'Garantia incondicional de 7 dias. Se você não gostar, devolvemos todo o seu dinheiro com um clique.')"
}
`;

        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: "system", content: "Você é um gerador de JSON puro. Nunca adicione blocos de código markdown ou texto antes/depois do JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8,
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0]?.message?.content || "{}";
        let parsedCopy;
        try {
            parsedCopy = JSON.parse(rawContent.trim());
        } catch (jsonErr) {
            console.error("Failed to parse AI output as JSON:", rawContent);
            // Fallback em caso de erro de formatação
            parsedCopy = {
                headline: `APRENDA A LUCRAR COM ${name.toUpperCase()} DO ZERO`,
                subheadline: "O método passo a passo mais rápido para atingir seus resultados sem enrolação",
                bullets: [
                    "Acesso vitalício ao conteúdo completo do método",
                    "Aprenda sem precisar de conhecimentos prévios",
                    "Método validado com suporte tirar dúvidas",
                    "Modelos prontos para copiar e colar",
                    "Economize tempo com o nosso passo a passo direto ao ponto"
                ],
                scarcity: "Oferta exclusiva por tempo limitado",
                bonuses: [
                    { title: "BÔNUS 1: Comunidade Exclusiva", description: "Interaja com outros alunos e acelere seus resultados.", value: "Grátis" },
                    { title: "BÔNUS 2: Cronograma 30 Dias", description: "O passo a passo diário para aplicar sem erro.", value: "Grátis" }
                ],
                guarantee: "Garantia incondicional de 7 dias. Seu risco é zero!"
            };
        }

        return NextResponse.json({ success: true, copy: parsedCopy });

    } catch (error: any) {
        console.error("[Offer Generate Copy API Error]:", error);
        return NextResponse.json({ error: error.message || "Erro interno ao gerar copy" }, { status: 500 });
    }
}
