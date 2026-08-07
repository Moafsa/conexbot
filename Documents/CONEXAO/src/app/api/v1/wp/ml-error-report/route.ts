import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            bot_id,
            tenant_id,
            site_url,
            woo_product_id,
            product_name,
            ml_item_id,
            error_message,
            plugin_version,
        } = body;

        if (!error_message) {
            return NextResponse.json({ error: "Missing error_message" }, { status: 400 });
        }

        let finalTenantId = tenant_id;
        if (!finalTenantId && bot_id) {
            const bot = await prisma.bot.findUnique({ where: { id: bot_id }, select: { tenantId: true } });
            finalTenantId = bot?.tenantId;
        }

        if (!finalTenantId) {
            return NextResponse.json({ error: "Tenant not identified" }, { status: 400 });
        }

        await prisma.mlErrorReport.create({
            data: {
                tenantId: finalTenantId,
                siteUrl: site_url || null,
                wooProductId: woo_product_id ? String(woo_product_id) : null,
                productName: product_name || null,
                mlItemId: ml_item_id || null,
                errorMessage: String(error_message).slice(0, 4000),
                pluginVersion: plugin_version || null,
            },
        });

        return NextResponse.json({ status: "recorded" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
