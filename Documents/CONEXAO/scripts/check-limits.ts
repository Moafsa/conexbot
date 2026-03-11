import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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

  console.log(JSON.stringify(tenant, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
