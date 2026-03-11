
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const bots = await prisma.bot.findMany({
      select: { id: true, name: true, modules: true, sessionName: true, businessType: true }
    });
    console.log('BOTS_DATA:' + JSON.stringify(bots, null, 2));
  } catch (e) {
    console.error('ERROR:' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
