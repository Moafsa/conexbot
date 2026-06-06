import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { botId, text } = body;
        
        if (!botId || !text) {
            return NextResponse.json({ error: 'Missing botId or text' }, { status: 400 });
        }

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { 
                id: botId, 
                OR: [
                    { tenantId: (session.user as any).id },
                    { tenant: { managedBy: { tenantId: (session.user as any).id } } }
                ] 
            }
        });

        if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

        // Call OpenAI to structure the menu
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Você é um extrator de dados de cardápios. O usuário enviará um texto desestruturado de um cardápio ou catálogo.
Você deve extrair as categorias, produtos e adicionais, e retornar um JSON estritamente neste formato:
{
  "categories": [
    {
      "name": "Nome da Categoria",
      "description": "Descrição opcional",
      "products": [
        {
          "name": "Nome do Produto",
          "description": "Descrição",
          "price": 0.00,
          "salePrice": null,
          "addonGroups": [
            {
              "name": "Ex: Escolha o Ponto da Carne / Adicionais",
              "minSelect": 0,
              "maxSelect": 1,
              "addons": [
                { "name": "Bacon", "price": 2.50 },
                { "name": "Ao Ponto", "price": 0.00 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
Sempre retorne apenas o JSON, sem markdown backticks.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        const jsonStr = response.choices[0].message.content || '{}';
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        const categories = parsed.categories || [];
        
        // Begin Database Transaction to insert everything
        await prisma.$transaction(async (tx) => {
            let orderIndex = 0;
            for (const cat of categories) {
                const categoryRecord = await tx.productCategory.create({
                    data: {
                        botId,
                        name: cat.name,
                        description: cat.description,
                        order: orderIndex++
                    }
                });

                const products = cat.products || [];
                for (const prod of products) {
                    const productRecord = await tx.product.create({
                        data: {
                            botId,
                            categoryId: categoryRecord.id,
                            name: prod.name,
                            description: prod.description,
                            price: Number(prod.price) || 0,
                            salePrice: prod.salePrice ? Number(prod.salePrice) : null,
                            type: 'SINGLE',
                            stock: 999, // default
                            active: true
                        }
                    });

                    const addonGroups = prod.addonGroups || [];
                    for (const group of addonGroups) {
                        const groupRecord = await tx.productAddonGroup.create({
                            data: {
                                botId,
                                products: { connect: { id: productRecord.id } },
                                name: group.name,
                                minSelect: group.minSelect || 0,
                                maxSelect: group.maxSelect || 10,
                                active: true
                            }
                        });

                        const addons = group.addons || [];
                        for (const addon of addons) {
                            await tx.productAddon.create({
                                data: {
                                    groupId: groupRecord.id,
                                    name: addon.name,
                                    price: Number(addon.price) || 0,
                                    active: true
                                }
                            });
                        }
                    }
                }
            }
        });

        return NextResponse.json({ success: true, message: 'Cardápio importado com sucesso!' });

    } catch (error: any) {
        console.error('Magic Import Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
