const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seed started: Products and Plans');

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

    console.log(`Product processed: ${product.name}`);

    for (const planData of plans) {
      const existing = await prisma.plan.findFirst({
        where: { name: planData.name },
      });
      if (existing) {
        await prisma.plan.update({
          where: { id: existing.id },
          data: {
            price: planData.price,
            messageLimit: planData.messageLimit,
            botLimit: planData.botLimit,
            trialDays: planData.trialDays,
            productCatalogId: product.id,
          },
        });
      } else {
        await prisma.plan.create({
          data: {
            ...planData,
            productCatalogId: product.id,
          },
        });
      }
      console.log(`  - Plan processed: ${planData.name}`);
    }
  }

  console.log('Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
