
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const bots = await prisma.bot.findMany({
      select: { id: true, name: true, businessType: true }
    });
    console.log('BOTS_LIST:' + JSON.stringify(bots));
  } catch (e) {
    console.error('ERROR:' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
