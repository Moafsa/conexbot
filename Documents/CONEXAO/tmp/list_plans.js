const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany({
    select: { id: true, name: true, type: true }
  });
  console.log('--- AVAILABLE PLANS ---');
  console.log(JSON.stringify(plans, null, 2));
  console.log('-----------------------');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
