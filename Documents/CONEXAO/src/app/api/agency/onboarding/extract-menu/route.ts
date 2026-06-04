import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeChatCompletion } from '@/lib/ai-provider';

const EXTRACT_MENU_PROMPT = `Você é um extrator de cardápios e catálogos de produtos.
Vou te fornecer um texto que o usuário colou, que representa um cardápio de restaurante, catálogo de serviços ou lista de produtos.
Sua tarefa é extrair os itens e retornar um JSON com um array chamado "products".
Cada produto deve ter o seguinte formato:
{
  "name": "Nome do produto/prato",
  "description": "Descrição detalhada dos ingredientes ou do que é o serviço. Mantenha fiel ao texto original, mas formatado de forma limpa.",
  "price": número (float, sem formatação de moeda, ex: 25.50),
  "category": "Categoria inferida (ex: Bebidas, Lanches, Sobremesas)",
  "salePrice": nulo ou número (se houver preço promocional)
}

Regras:
1. Ignore textos irrelevantes (endereços, telefones, mensagens de bom dia).
2. Se o preço não for encontrado ou não estiver claro, use 0 ou tente deduzir.
3. Responda APENAS com o JSON no formato:
{
  "products": [
    { ... }
  ]
}
sem markdown, sem blocos de código (\`\`\`).`;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { menuText } = await req.json();
    if (!menuText || typeof menuText !== 'string') {
        return NextResponse.json({ error: 'menuText é obrigatório e deve ser um texto' }, { status: 400 });
    }

    try {
        // Build a minimal bot-like object for safeChatCompletion
        const mockBot = {
            aiProvider: 'openai',
            aiModel: 'gpt-4o-mini',
            tenant: {
                openaiApiKey: null,
                geminiApiKey: null,
                openrouterApiKey: null,
            },
        };

        const truncatedContent = menuText.slice(0, 10000); // Prevent gigantic inputs

        const result = await safeChatCompletion({
            bot: mockBot,
            messages: [
                { role: 'system', content: EXTRACT_MENU_PROMPT },
                { role: 'user', content: `TEXTO DO CARDÁPIO:\n\n${truncatedContent}` },
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
            max_tokens: 10000,
        });

        let content = result?.content || '{"products":[]}';
        content = content.trim();
        if (content.startsWith('```json')) {
            content = content.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (content.startsWith('```')) {
            content = content.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const extracted = JSON.parse(content);

        return NextResponse.json({
            success: true,
            products: extracted.products || [],
        });
    } catch (err: any) {
        console.error('[ExtractMenu Error]', err);
        return NextResponse.json({
            success: false,
            error: 'Falha ao extrair cardápio. Verifique se o texto está claro e tente novamente.',
            details: err.message
        }, { status: 500 });
    }
}
