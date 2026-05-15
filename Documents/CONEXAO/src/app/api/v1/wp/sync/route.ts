import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MercadoLivreService } from "@/services/mercadolivre/service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { woo_product_id, price, stock, bot_id, tenant_id } = body;

        if (!woo_product_id || (!price && stock === undefined)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Identify the tenant
        let finalTenantId = tenant_id;
        if (!finalTenantId && bot_id) {
            const bot = await prisma.bot.findUnique({ where: { id: bot_id }, select: { tenantId: true } });
            finalTenantId = bot?.tenantId;
        }

        if (!finalTenantId) {
            return NextResponse.json({ error: "Tenant not identified" }, { status: 400 });
        }

        // Find mappings for this product
        const mappings = await prisma.productMapping.findMany({
            where: { tenantId: finalTenantId, wooProductId: String(woo_product_id) }
        });

        if (mappings.length === 0) {
            return NextResponse.json({ status: "skipped", message: "No mappings found for this product." });
        }

        const results = [];
        for (const mapping of mappings) {
            try {
                const updateData: any = {};
                if (price) updateData.price = price;
                if (stock !== undefined) updateData.available_quantity = stock;

                const mlResponse = await MercadoLivreService.updateItem(finalTenantId, mapping.mlItemId, updateData);
                
                await prisma.productMapping.update({
                    where: { id: mapping.id },
                    data: { 
                        lastSync: new Date(),
                        syncStatus: mlResponse.error ? "ERROR" : "SUCCESS",
                        errorMessage: mlResponse.error ? JSON.stringify(mlResponse) : null
                    }
                });

                results.push({ mlItemId: mapping.mlItemId, success: !mlResponse.error });
            } catch (err: any) {
                results.push({ mlItemId: mapping.mlItemId, success: false, error: err.message });
            }
        }

        return NextResponse.json({ status: "processed", results });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
