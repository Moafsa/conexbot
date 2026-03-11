const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantId = 'f1aa4e70-ccd5-4919-b7e7-4384c2429a47';
  
  console.log('--- Force Updating Limits to Ilimitado (0) ---');
  
  // 1. Update UsageCounter
  const counter = await prisma.usageCounter.update({
    where: { tenantId },
    data: {
      messagesLimit: 0,
      warned90: false,
      warned100: false
    }
  });
  console.log('✅ UsageCounter updated:', JSON.stringify(counter, null, 2));

  // 2. Update Subscription to ACTIVE to allow auto-sync in the future
  const sub = await prisma.subscription.update({
    where: { tenantId },
    data: {
      status: 'ACTIVE'
    }
  });
  console.log('✅ Subscription status set to ACTIVE:', sub.status);

  console.log('\n--- Final Verification ---');
  const check = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { usageCounter: true, subscription: true }
  });
  console.log(JSON.stringify(check, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
