const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mercado Livre Sync product...');
  
  const mlProduct = await prisma.productCatalog.upsert({
    where: { name: 'MERCADO_LIVRE_SYNC' },
    update: {
        name: 'MERCADO_LIVRE_SYNC',
        description: 'Sincronização bidirecional de estoque e preços com Mercado Livre e IA.',
        minMonthlyPrice: 49.90,
        minSetupPrice: 99.00
    },
    create: {
      name: 'MERCADO_LIVRE_SYNC',
      description: 'Sincronização bidirecional de estoque e preços com Mercado Livre e IA.',
      minMonthlyPrice: 49.90,
      minSetupPrice: 99.00
    }
  });

  console.log('Product created/updated:', mlProduct.id);

  // Add plans
  const plans = [
    { name: 'Mensal', price: 49.90, interval: 'MONTHLY' },
    { name: 'Trimestral', price: 129.90, interval: 'QUARTERLY' },
    { name: 'Anual', price: 479.90, interval: 'YEARLY' }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { 
        catalogProductId_name: {
          catalogProductId: mlProduct.id,
          name: plan.name
        }
      },
      update: {
        price: plan.price,
        interval: plan.interval
      },
      create: {
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        catalogProductId: mlProduct.id
      }
    });
  }

  console.log('Plans created/updated.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
