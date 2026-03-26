import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWpToken } from '@/lib/wp-token';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const botIdHeader = req.headers.get('x-bot-id'); // Header opcional para múltiplos bots

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token (Bearer) não fornecido ou inválido' }, { status: 401 });
        }

        const tokenString = authHeader.split(' ')[1];
        const decoded = verifyWpToken(tokenString);

        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
        }

        const tenantId = decoded.id as string;
        const body = await req.json();
        const { type, data } = body; 

        if (!type || !data) {
             return NextResponse.json({ error: 'Payload malformado (type e data requeridos)' }, { status: 400 });
        }
        
        // Pega o bot específico (se header presente) ou o principal do usuário
        const bot = await prisma.bot.findFirst({
            where: botIdHeader ? { id: botIdHeader, tenantId } : { tenantId, status: 'active' },
            orderBy: { createdAt: 'asc' }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Nenhum Bot Ativo encontrado na conta para receber o Sync' }, { status: 404 });
        }

        // Marcar como bot vinculado ao WordPress se ainda não estiver
        if (!(bot as any).isWordpress) {
            await prisma.bot.update({
                where: { id: bot.id },
                data: { isWordpress: true }
            });
        }

        if (type === 'product') {
            const existingProduct = await prisma.product.findFirst({
                where: { botId: bot.id, name: data.name } // Pode ser substituído por SKU ou externalId futuro
            });

            if (existingProduct) {
                await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: {
                        price: parseFloat(data.price || 0),
                        stock: parseInt(data.stock || 0),
                        description: data.description || existingProduct.description,
                        active: data.active !== undefined ? data.active : true,
                        externalUrl: data.url || existingProduct.externalUrl
                    }
                });
            } else {
                await prisma.product.create({
                    data: {
                        name: data.name,
                        price: parseFloat(data.price || 0),
                        stock: parseInt(data.stock || 0),
                        description: data.description || '',
                        active: data.active !== undefined ? data.active : true,
                        botId: bot.id,
                        externalUrl: data.url || ''
                    }
                });
            }
        } else if (type === 'order') {
             // Futuramente: Update Order Table 
             return NextResponse.json({ success: true, message: 'Order sync não implementado ainda, mas payload recebido' });
        }

        return NextResponse.json({ success: true, message: `Sync de [${type}] executado com sucesso no bot ${bot.name}` });

    } catch (error: any) {
        console.error('WP Sync Error:', error);
        return NextResponse.json({ error: 'Erro interno ao sincronizar webhook do WordPress' }, { status: 500 });
    }
}
