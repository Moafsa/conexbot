import prisma from '@/lib/prisma';

export class CartService {
  /**
   * Obtém ou cria um carrinho ativo para o contato no escopo de um bot.
   */
  static async getOrCreateCart(botId: string, contactPhone: string) {
    let cart = await prisma.cart.findFirst({
      where: { botId, contactPhone, status: 'ACTIVE' },
      include: { items: { include: { addons: true, product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          botId,
          contactPhone,
          status: 'ACTIVE',
        },
        include: { items: { include: { addons: true, product: true } } },
      });
    }

    return cart;
  }

  /**
   * Adiciona um produto e seus adicionais ao carrinho.
   */
  static async addToCart(botId: string, contactPhone: string, productId: string, quantity: number, addonIds: string[] = []) {
    const cart = await this.getOrCreateCart(botId, contactPhone);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Produto não encontrado: ${productId}`);
    }

    const price = product.salePrice ?? product.price;

    // Criar o item no carrinho
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: price,
      },
    });

    // Validar e adicionar os adicionais (se houver)
    let totalAddonsPrice = 0;
    if (addonIds.length > 0) {
      const addons = await prisma.productAddon.findMany({
        where: { id: { in: addonIds } },
      });

      for (const addon of addons) {
        await prisma.cartItemAddon.create({
          data: {
            cartItemId: cartItem.id,
            addonId: addon.id,
            unitPrice: addon.price,
            quantity: 1, // Atualmente fixado em 1 por item
          },
        });
        totalAddonsPrice += addon.price;
      }
    }

    // Calcula o subtotal deste novo item
    const itemSubtotal = (price + totalAddonsPrice) * quantity;
    
    return {
      success: true,
      cartItem,
      itemSubtotal,
      message: `Item adicionado com sucesso. Subtotal: R$ ${itemSubtotal.toFixed(2)}`,
    };
  }

  /**
   * Lista o carrinho atual com totais
   */
  static async getCartSummary(botId: string, contactPhone: string) {
    const cart = await this.getOrCreateCart(botId, contactPhone);

    let total = 0;
    const items = cart.items.map(item => {
      let addonsTotal = 0;
      const addonsSummary = item.addons.map(addon => {
        addonsTotal += addon.unitPrice * addon.quantity;
        return { name: addon.addonId /* We need relations loaded to show names, but for now we calculate */, price: addon.unitPrice };
      });

      const itemSubtotal = (item.unitPrice + addonsTotal) * item.quantity;
      total += itemSubtotal;

      return {
        productName: item.product.name,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    return {
      total,
      items,
    };
  }
}
