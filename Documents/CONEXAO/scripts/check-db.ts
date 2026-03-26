import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://admin:CHANGE_ME@localhost:5434/conext_db?schema=public' });
    return new PrismaClient({ adapter });
};

const prisma = prismaClientSingleton();

async function main() {
  try {
    const count = await prisma.bot.count();
    console.log(`Bot Count: ${count}`);
    const tenants = await prisma.tenant.findMany();
    console.log(`Tenant Count: ${tenants.length}`);
    console.log('Tenants:', JSON.stringify(tenants.map(t => ({ id: t.id, email: t.email })), null, 2));
    
    if (count > 0) {
      const bots = await prisma.bot.findMany({
        take: 5,
        select: { id: true, name: true, tenantId: true }
      });
      console.log('Sample Bots:', JSON.stringify(bots, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
