import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { shopUrl, tenantId } = body;

        if (!shopUrl || !tenantId) {
            return NextResponse.json({ error: "shopUrl and tenantId are required" }, { status: 400 });
        }

        // Clean shopUrl (remove protocol and trailing slashes for easier comparison)
        const cleanUrl = shopUrl.replace(/https?:\/\//, '').replace(/\/$/, '');

        // 1. Check if there is an existing bot for this tenant with the same websiteUrl
        let bot = await prisma.bot.findFirst({
            where: {
                tenantId: tenantId,
                websiteUrl: {
                    contains: cleanUrl
                }
            }
        });

        // 2. If no bot exists, look for any bot or create a new specific bot
        if (!bot) {
            bot = await prisma.bot.create({
                data: {
                    name: `Loja WooCommerce (${cleanUrl})`,
                    businessType: "COMMERCIAL",
                    tenantId: tenantId,
                    websiteUrl: shopUrl,
                }
            });
        }

        return NextResponse.json({ botId: bot.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
