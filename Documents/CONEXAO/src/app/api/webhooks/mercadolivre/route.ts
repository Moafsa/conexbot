import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MercadoLivreService } from "@/services/mercadolivre/service";
import { WordPressService } from "@/services/wordpress/service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { resource, user_id, topic } = body;

        console.log(`[ML Webhook] Received topic ${topic} for resource ${resource} (User: ${user_id})`);

        if (topic === "items") {
            const mlItemId = resource.split("/").pop();
            
            // Find tenant by mlUserId
            const tenant = await prisma.tenant.findFirst({
                where: { mlUserId: String(user_id) },
                include: { bots: { where: { isWordpress: true, status: 'active' }, take: 1 } }
            });

            if (!tenant) {
                console.warn(`[ML Webhook] Tenant not found for ML User ID ${user_id}`);
                return NextResponse.json({ status: "skipped", reason: "Tenant not found" });
            }

            // Get item details from ML
            const mlItem = await MercadoLivreService.getItem(tenant.id, mlItemId);

            // Find mapping
            const mapping = await prisma.productMapping.findFirst({
                where: { tenantId: tenant.id, mlItemId: mlItemId }
            });

            if (mapping && tenant.bots[0]?.websiteUrl) {
                // Sync to WordPress
                await WordPressService.syncToWp(tenant.bots[0].websiteUrl, {
                    woo_product_id: mapping.wooProductId,
                    price: mlItem.price,
                    stock: mlItem.available_quantity,
                    source: "mercado_livre"
                });

                await prisma.productMapping.update({
                    where: { id: mapping.id },
                    data: { lastSync: new Date(), syncStatus: "SUCCESS" }
                });
            }
        }

        // Always acknowledge receipt to ML
        return NextResponse.json({ status: "ok" });

    } catch (error: any) {
        console.error("[ML Webhook] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 200 }); // Return 200 to avoid retries if it's a known error
    }
}
