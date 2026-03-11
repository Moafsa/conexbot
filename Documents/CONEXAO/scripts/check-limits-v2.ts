import { prisma } from '../src/lib/prisma';

async function main() {
  const tenantId = 'f1aa4e70-ccd5-4919-b7e7-4384c2429a47';
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      usageCounter: true,
      subscription: {
        include: {
          plan: true
        }
      }
    }
  });

  console.log('--- TENANT DATA ---');
  console.log(JSON.stringify(tenant, null, 2));
  
  const allPlans = await prisma.plan.findMany();
  console.log('--- ALL PLANS ---');
  console.log(JSON.stringify(allPlans, null, 2));
}

main()
  .catch(e => {
    console.error('Error running script:');
    console.error(e);
  })
  .finally(() => prisma.$disconnect());
