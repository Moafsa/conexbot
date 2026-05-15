import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL || "postgresql://admin:password123@localhost:5434/conext_db?schema=public";
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const products = [
        {
            name: "CONEXT_BOT",
            description: "Agente de atendimento inteligente via WhatsApp com automação e CRM.",
            minMonthlyPrice: 97,
            minSetupPrice: 197
        },
        {
            name: "MARKETING_IA",
            description: "Criação e gerenciamento automatizado de campanhas de marketing com IA.",
            minMonthlyPrice: 147,
            minSetupPrice: 297
        },
        {
            name: "CRM_PIPELINE",
            description: "Gestão de clientes, pipeline de vendas e follow-up automatizado.",
            minMonthlyPrice: 47,
            minSetupPrice: 0
        },
        {
            name: "CONEXT_WRITER",
            description: "Plugin WordPress para geração de conteúdo SEO com Inteligência Artificial.",
            minMonthlyPrice: 29,
            minSetupPrice: 0
        }
    ];

    for (const p of products) {
        await prisma.productCatalog.upsert({
            where: { name: p.name },
            update: p,
            create: p
        });
        console.log(`PRODUTO RESTAURADO: ${p.name}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
