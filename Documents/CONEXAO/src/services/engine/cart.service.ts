import prisma from '@/lib/prisma';

export class CartService {
    /**
     * Obtém ou cria um carrinho ativo para o contato no escopo de um bot.
     * Carrinhos ativos sem atualização há mais de 30 minutos são abandonados automaticamente.
     */
    static async getOrCreateCart(botId: string, contactPhone: string) {
        let cart = await prisma.cart.findFirst({
            where: { botId, contactPhone, status: 'ACTIVE' },
            include: { items: { include: { addons: true, product: true } } },
        });

        if (cart && (Date.now() - new Date(cart.updatedAt).getTime() > 4 * 60 * 60 * 1000)) { // 4h TTL
            await prisma.cart.update({
                where: { id: cart.id },
                data: { status: 'ABANDONED' }
            }).catch(() => {});
            cart = null;
        }

        if (!cart) {
            cart = await prisma.cart.create({
                data: { botId, contactPhone, status: 'ACTIVE' },
                include: { items: { include: { addons: true, product: true } } },
            });
        }

        return cart;
    }

    /**
     * Adiciona ou incrementa item no carrinho por ID do produto.
     * Se o produto já existe no carrinho, soma a quantidade.
     */
    static async addItem(botId: string, contactPhone: string, productId: string, quantity: number) {
        const cart = await this.getOrCreateCart(botId, contactPhone);

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error(`Produto não encontrado: ${productId}`);

        const unitPrice = Number(product.salePrice ?? product.price);

        // Check if item already in cart — if so, update quantity
        const existing = cart.items.find(i => i.productId === productId);
        if (existing) {
            await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity, unitPrice }
            });
        }

        // Refresh cart
        const updated = await this.getOrCreateCart(botId, contactPhone);
        const total = this.calcTotal(updated.items as any[]);

        return {
            success: true,
            productName: product.name,
            quantity,
            unitPrice,
            total,
            message: `✅ ${quantity}x ${product.name} adicionado. Total atual: R$ ${total.toFixed(2)}`
        };
    }

    /**
     * Remove um item do carrinho pelo ID do produto.
     */
    static async removeItem(botId: string, contactPhone: string, productId: string) {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        const item = cart.items.find(i => i.productId === productId);
        if (!item) return { success: false, message: 'Item não encontrado no carrinho.' };

        await prisma.cartItem.delete({ where: { id: item.id } });
        return { success: true, message: 'Item removido do carrinho.' };
    }

    /**
     * Atualiza a quantidade de um produto no carrinho.
     * Se quantity = 0, remove o item.
     */
    static async updateItemQuantity(botId: string, contactPhone: string, productId: string, quantity: number) {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        const item = cart.items.find(i => i.productId === productId);
        if (!item) return { success: false, message: 'Item não encontrado no carrinho.' };

        if (quantity <= 0) {
            await prisma.cartItem.delete({ where: { id: item.id } });
            return { success: true, message: 'Item removido do carrinho.' };
        }

        await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
        const updated = await this.getOrCreateCart(botId, contactPhone);
        const total = this.calcTotal(updated.items as any[]);
        return { success: true, total, message: `Quantidade atualizada. Total: R$ ${total.toFixed(2)}` };
    }

    /**
     * Define o endereço de entrega do carrinho (validado externamente via Mapbox antes de chamar).
     * Também salva o endereço no perfil do cliente (ContactAddress) e atualiza Contact.needs.
     */
    static async setDeliveryAddress(
        botId: string,
        contactPhone: string,
        address: string,
        lat: number | null,
        lng: number | null,
        contactId: string,
        label?: string | null
    ) {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        await prisma.cart.update({
            where: { id: cart.id },
            data: { deliveryAddress: address, deliveryLat: lat, deliveryLng: lng }
        });

        // Save to ContactAddress profile if not already saved
        if (address && address.length > 5 && contactId) {
            const cleanAddr = address.trim();
            const existing = await prisma.contactAddress.findFirst({
                where: {
                    contactId,
                    address: { contains: cleanAddr.substring(0, 10), mode: 'insensitive' }
                }
            }).catch(() => null);

            if (!existing) {
                await prisma.contactAddress.create({
                    data: {
                        contactId,
                        label: label ? label.trim() : undefined,
                        address: cleanAddr,
                        latitude: lat ?? undefined,
                        longitude: lng ?? undefined
                    }
                }).catch((e: any) => console.error('[CartService] ContactAddress save error:', e?.message));
            } else if (label && !existing.label) {
                await prisma.contactAddress.update({
                    where: { id: existing.id },
                    data: { label: label.trim() }
                }).catch(() => {});
            }

            // Update contact.needs with latest address
            await prisma.contact.update({
                where: { id: contactId },
                data: { needs: cleanAddr }
            }).catch(() => {});
        }

        return { success: true, address, message: `📍 Endereço definido: ${address}` };
    }

    /**
     * Define a forma de pagamento e valor de troco.
     */
    static async setPaymentMethod(
        botId: string,
        contactPhone: string,
        method: string,
        changeAmount: number | null = null
    ) {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        await prisma.cart.update({
            where: { id: cart.id },
            data: { paymentMethod: method.toUpperCase(), changeAmount }
        });
        return { success: true, method, message: `💳 Pagamento: ${method}${changeAmount ? ` (troco para R$ ${changeAmount})` : ''}` };
    }

    /**
     * Retorna resumo completo do carrinho atual.
     */
    static async getCartSummary(botId: string, contactPhone: string) {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        const total = this.calcTotal(cart.items as any[]);

        const itemsText = cart.items.map((item: any) =>
            `- ${item.quantity}x ${item.product.name} (R$ ${Number(item.unitPrice).toFixed(2)} cada) = R$ ${(item.quantity * Number(item.unitPrice)).toFixed(2)}`
        ).join('\n');

        const notesSuffix = cart.notes ? `\n📝 Observação: ${cart.notes}` : '';

        return {
            cartId: cart.id,
            hasItems: cart.items.length > 0,
            items: cart.items.map((i: any) => ({
                productId: i.productId,
                productName: i.product.name,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
                subtotal: i.quantity * Number(i.unitPrice)
            })),
            itemsText,
            deliveryAddress: cart.deliveryAddress,
            deliveryLat: cart.deliveryLat,
            deliveryLng: cart.deliveryLng,
            paymentMethod: cart.paymentMethod,
            changeAmount: cart.changeAmount,
            notes: cart.notes ?? null,
            total,
            totalAmount: total,
            summary: cart.items.length === 0
                ? '🛒 Carrinho vazio.'
                : `🛒 Carrinho:\n${itemsText}\n📍 Endereço: ${cart.deliveryAddress || 'Não definido'}\n💳 Pagamento: ${cart.paymentMethod || 'Não definido'}\n💰 Total: R$ ${total.toFixed(2)}${notesSuffix}`
        };
    }

    /**
     * Verifica se o carrinho está pronto para fechar (tem itens, endereço e pagamento).
     */
    static async isReadyForCheckout(botId: string, contactPhone: string): Promise<{ ready: boolean; missing: string[] }> {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        const missing: string[] = [];
        if (cart.items.length === 0) missing.push('itens no carrinho');
        if (!cart.deliveryAddress) missing.push('endereço de entrega');
        if (!cart.paymentMethod) missing.push('forma de pagamento');
        return { ready: missing.length === 0, missing };
    }

    /**
     * Fecha o carrinho e retorna os dados para criação do Order.
     * NÃO cria o Order — apenas prepara os dados e muda status para COMPLETED.
     */
    static async setNotes(botId: string, contactPhone: string, notes: string) {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        await prisma.cart.update({ where: { id: cart.id }, data: { notes } });
        return { success: true };
    }

    static async convertToOrderData(botId: string, contactPhone: string) {
        const cart = await this.getOrCreateCart(botId, contactPhone);
        const readiness = await this.isReadyForCheckout(botId, contactPhone);

        if (!readiness.ready) {
            throw new Error(`Carrinho incompleto. Faltando: ${readiness.missing.join(', ')}`);
        }

        const total = this.calcTotal(cart.items as any[]);

        const orderItems = cart.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice)
        }));

        // Mark cart as completed
        await prisma.cart.update({ where: { id: cart.id }, data: { status: 'COMPLETED' } });

        return {
            cartId: cart.id,
            address: cart.deliveryAddress!,
            latitude: cart.deliveryLat,
            longitude: cart.deliveryLng,
            paymentMethod: cart.paymentMethod!,
            changeAmount: cart.changeAmount,
            totalAmount: total,
            items: orderItems,
            notes: cart.notes ?? null
        };
    }

    /**
     * Descarta o carrinho ativo (marca como ABANDONED).
     * Chamado quando a sessão encerra sem confirmar, para evitar pedidos fantasmas.
     */
    static async clearCart(botId: string, contactPhone: string) {
        const cart = await prisma.cart.findFirst({
            where: { botId, contactPhone, status: 'ACTIVE' }
        });
        if (cart) {
            await prisma.cart.update({ where: { id: cart.id }, data: { status: 'ABANDONED' } });
        }
        return { success: true };
    }

    // ─── Private Helpers ───────────────────────────────────────────────────

    static calcTotal(items: Array<{ quantity: number; unitPrice: number }>): number {
        return items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
    }
}
