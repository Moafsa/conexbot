import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAiClient } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { messages, botId, postFormat = "SINGLE" } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Mensagens são obrigatórias" }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.id },
            select: { openaiApiKey: true, geminiApiKey: true, openrouterApiKey: true, anthropicApiKey: true }
        });

        if (!tenant) throw new Error("Tenant não encontrado");

        // Buscar contexto do Bot
        let botContext = "";
        if (botId) {
            const bot = await prisma.bot.findUnique({
                where: { id: botId },
                select: { knowledgeBase: true, productsServices: true, businessType: true, name: true }
            });
            if (bot) {
                botContext = `\nCONTEXTO DO CLIENTE QUE VOCÊ ATENDE (${bot.name}):\n- Negócio: ${bot.businessType}\n- Produtos: ${bot.productsServices}\n- Conhecimento: ${bot.knowledgeBase}`;
            }
        }

        const { client } = await getAiClient({ provider: "openai", tenant });

        let jsonResponseFormat = `
        {
          "caption": "texto da legenda em PORTUGUÊS aqui",
          "hashtags": ["tag1", "tag2"],
          "imagePrompt": "prompt detalhado em inglês para geração da imagem de fundo"
        }
        `;

        if (postFormat === "CAROUSEL") {
            jsonResponseFormat = `
            {
              "caption": "texto da legenda em PORTUGUÊS aqui",
              "hashtags": ["tag1", "tag2"],
              "imagePrompt": "prompt geral em inglês para a imagem de capa",
              "slides": [
                {
                  "slide": 1,
                  "title": "TÍTULO DO SLIDE (em PORTUGUÊS)",
                  "content": "CONTEÚDO DO SLIDE (em PORTUGUÊS)",
                  "visualDescription": "Instrução visual (em PORTUGUÊS)"
                }
              ]
            }
            `;
        }

        const systemMessage = {
            role: "system",
            content: `Você é um Criador de Conteúdo Sênior de uma agência de publicidade trabalhando com o usuário de forma iterativa via chat.
            
            Sempre que criar ou refinar um conteúdo de postagem (caption, roteiro, carrossel), você DEVE RETORNAR UM JSON VÁLIDO contendo o post completo refinado.
            Você também pode conversar com o usuário, respondendo dúvidas.
            
            Por isso, seu retorno deve SEMPRE ter 2 coisas no JSON principal:
            1. "chatReply": O texto que você fala no chat para o usuário (ex: "Claro, deixei a legenda mais curta como você pediu!").
            2. "postDraft": O objeto com a estrutura do post refinado.

            ESTRUTURA ESPERADA DO JSON DE RESPOSTA:
            {
              "chatReply": "Sua resposta conversacional aqui...",
              "postDraft": ${jsonResponseFormat}
            }${botContext}`
        };

        const apiMessages = [systemMessage, ...messages];

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: apiMessages,
            response_format: { type: "json_object" }
        });

        const rawContent = completion.choices[0].message.content || "{}";
        const cleanJson = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let result: any = {};
        try {
            result = JSON.parse(cleanJson);
        } catch (e) {
            console.error("[ChatGenerate] Erro de parse:", rawContent);
            return NextResponse.json({ error: "A IA retornou um formato inválido." }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[API_MARKETING_CHAT] Error:", error);
        return NextResponse.json({ error: error.message || "Erro no chat" }, { status: 500 });
    }
}
