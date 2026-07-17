import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { safeChatCompletion } from '@/lib/ai-provider';
import prisma from '@/lib/prisma';

const EXTRACT_MENU_PROMPT = `Você é um extrator de cardápios e catálogos de produtos.
Vou te fornecer um texto que o usuário colou, que representa um cardápio de restaurante, catálogo de serviços ou lista de produtos.
Sua tarefa é extrair os itens e retornar um JSON com um array chamado "products".
Cada produto deve ter o seguinte formato:
{
  "name": "Nome do produto/prato (inclua o nome da variação se houver, ex: 'Xis da Casa - Mini')",
  "description": "Descrição detalhada dos ingredientes ou serviço.",
  "price": número (float, ex: 25.50),
  "category": "Categoria inferida (ex: Bebidas, Lanches, Sobremesas)",
  "salePrice": nulo ou número,
  "addonGroups": [
    {
      "name": "Nome do grupo (ex: Adicionais, Escolha o sabor, Bebidas)",
      "minSelect": 0,
      "maxSelect": 10,
      "addons": [
        { "name": "Bacon", "price": 2.50 },
        { "name": "Ao Ponto", "price": 0.00 }
      ]
    }
  ]
}

Regras:
1. Ignore textos irrelevantes.
2. Se o preço não for encontrado, use 0.
3. IMPORTANTE: Se um produto tiver **variações de tamanho ou tipo** com preços diferentes (ex: Normal R$ 33 / Mini R$ 30), crie **produtos separados** para cada variação (ex: um produto "Xis - Normal" e outro "Xis - Mini"), copiando a mesma descrição para ambos, mas com seus respectivos preços.
4. IMPORTANTE: Extraia ingredientes cobrados à parte, escolhas obrigatórias ou opcionais estruturando-os dentro de "addonGroups". Não coloque os adicionais dentro da "description" se eles tiverem valores separados.
5. Responda APENAS com o JSON no formato:
{
  "products": [
    { ... }
  ]
}`;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { menuText } = await req.json();
    if (!menuText || typeof menuText !== 'string') {
        return NextResponse.json({ error: 'menuText é obrigatório e deve ser um texto' }, { status: 400 });
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.id },
            include: {
                agency: true,
                managedBy: true
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
        }

        // Build a minimal bot-like object for safeChatCompletion
        const mockBot = {
            aiProvider: 'openai',
            aiModel: 'gpt-4o-mini',
            tenant: tenant,
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
        let errorMsg = 'Falha ao extrair cardápio. Verifique se o texto está claro e tente novamente.';
        if (err.message && err.message.includes('All AI providers failed')) {
            errorMsg = 'Falha na IA: Nenhuma chave de API válida foi encontrada. Configure sua chave da OpenAI ou Gemini nas configurações da Agência.';
        } else if (err.message) {
            errorMsg = err.message;
        }
        
        return NextResponse.json({
            success: false,
            error: errorMsg,
        }, { status: 500 });
    }
}
