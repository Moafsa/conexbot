import { MercadoLivreService } from "@/services/mercadolivre/service";
import prisma from "@/lib/prisma";

export const mercadoLivreTools = [
    {
        name: "ml_get_item",
        description: "Busca detalhes de um item no Mercado Livre pelo ID (ex: MLB12345).",
        parameters: {
            type: "object",
            properties: {
                ml_item_id: { type: "string", description: "ID do item no Mercado Livre" }
            },
            required: ["ml_item_id"]
        },
        execute: async (args: any, context: any) => {
            const tenantId = context.tenantId;
            return await MercadoLivreService.getItem(tenantId, args.ml_item_id);
        }
    },
    {
        name: "ml_update_price",
        description: "Atualiza o preço de um item no Mercado Livre.",
        parameters: {
            type: "object",
            properties: {
                ml_item_id: { type: "string", description: "ID do item no Mercado Livre" },
                price: { type: "number", description: "Novo preço" }
            },
            required: ["ml_item_id", "price"]
        },
        execute: async (args: any, context: any) => {
            const tenantId = context.tenantId;
            return await MercadoLivreService.updateItem(tenantId, args.ml_item_id, { price: args.price });
        }
    },
    {
        name: "ml_get_sync_status",
        description: "Verifica o status de sincronização de um produto entre WooCommerce e Mercado Livre.",
        parameters: {
            type: "object",
            properties: {
                woo_product_id: { type: "string", description: "ID do produto no WooCommerce" }
            },
            required: ["woo_product_id"]
        },
        execute: async (args: any, context: any) => {
            const tenantId = context.tenantId;
            const mapping = await prisma.productMapping.findFirst({
                where: { tenantId, wooProductId: args.woo_product_id }
            });
            return mapping || { status: "not_mapped", message: "Este produto ainda não foi vinculado ao Mercado Livre." };
        }
    }
];
