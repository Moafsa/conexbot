import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = [
        {
            name: "CONEXT_BOT",
            description: "Agente de IA especializado em atendimento via WhatsApp.",
            minMonthlyPrice: 15.0,
            minSetupPrice: 0.0,
            plans: [
                { name: "Starter", price: 29.90, messageLimit: 5000, botLimit: 1, trialDays: 7 },
                { name: "Pro", price: 59.90, messageLimit: 20000, botLimit: 5, trialDays: 0 },
                { name: "Enterprise", price: 199.90, messageLimit: 100000, botLimit: 20, trialDays: 0 }
            ]
        },
        {
            name: "MARKETING_IA",
            description: "Gestão completa de tráfego e posts com IA.",
            minMonthlyPrice: 50.0,
            minSetupPrice: 100.0,
            plans: [
                { name: "Basic", price: 149.00, messageLimit: 0, botLimit: 0, trialDays: 3 },
                { name: "Scale", price: 499.00, messageLimit: 0, botLimit: 0, trialDays: 0 }
            ]
        },
        {
            name: "CRM_PIPELINE",
            description: "Pipeline de vendas integrado com automações.",
            minMonthlyPrice: 20.0,
            minSetupPrice: 0.0,
            plans: [
                { name: "Growth", price: 89.00, messageLimit: 0, botLimit: 0, trialDays: 15 }
            ]
        },
        {
            name: "CONEXT_WRITER",
            description: "Plugin de escrita para WordPress potenciado por IA.",
            minMonthlyPrice: 10.0,
            minSetupPrice: 0.0,
            plans: [
                { name: "Plugin Solo", price: 47.00, messageLimit: 0, botLimit: 0, trialDays: 7 }
            ]
        }
    ];

    try {
        const results = [];
        for (const pData of products) {
            const { plans, ...productInfo } = pData;
            
            const product = await prisma.productCatalog.upsert({
                where: { name: productInfo.name },
                update: {
                    description: productInfo.description,
                    minMonthlyPrice: productInfo.minMonthlyPrice,
                    minSetupPrice: productInfo.minSetupPrice,
                },
                create: productInfo,
            });

            const planResults = [];
            for (const planData of plans) {
                const existing = await prisma.plan.findFirst({
                    where: { name: planData.name },
                });
                const plan = existing
                    ? await prisma.plan.update({
                        where: { id: existing.id },
                        data: {
                            price: planData.price,
                            messageLimit: planData.messageLimit,
                            botLimit: planData.botLimit,
                            trialDays: planData.trialDays,
                            productCatalogId: product.id,
                        },
                    })
                    : await prisma.plan.create({
                        data: {
                            ...planData,
                            productCatalogId: product.id,
                        },
                    });
                planResults.push(plan.name);
            }
            results.push({ product: product.name, plans: planResults });
        }

        return NextResponse.json({ success: true, synced: results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
