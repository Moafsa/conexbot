import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding Marketplace...");

    // 1. Criar Produtos Base
    const products = [
        { name: "WHATSAPP_BOT", description: "Agente Inteligente para WhatsApp", minMonthlyPrice: 97, minSetupPrice: 197 },
        { name: "INSTAGRAM_BOT", description: "Agente de Automação Instagram/Facebook", minMonthlyPrice: 77, minSetupPrice: 147 },
        { name: "MARKETING_IA", description: "Módulo Agência de Marketing IA & Ads", minMonthlyPrice: 147, minSetupPrice: 297 },
        { name: "AI_WRITER", description: "Gerador de Conteúdo SEO (WordPress)", minMonthlyPrice: 47, minSetupPrice: 0 },
    ];

    for (const p of products) {
        await prisma.productCatalog.upsert({
            where: { name: p.name },
            update: p,
            create: p
        });
    }

    // 2. Criar Tiers de Taxas
    const tiers = [
        { minSalesVolume: 0, feePercentage: 20.0 },     // 0 - 5k: 20%
        { minSalesVolume: 5000, feePercentage: 15.0 },  // 5k - 15k: 15%
        { minSalesVolume: 15000, feePercentage: 12.0 }, // 15k - 50k: 12%
        { minSalesVolume: 50000, feePercentage: 10.0 }, // > 50k: 10%
    ];

    for (const t of tiers) {
        await prisma.agencyTier.upsert({
            where: { id: `tier_${t.minSalesVolume}` }, // Dummy ID para seed estável
            update: t,
            create: { ...t, id: `tier_${t.minSalesVolume}` }
        });
    }

    console.log("Marketplace Seeded Successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
