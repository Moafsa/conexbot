
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const bots = await prisma.bot.findMany({
      select: { id: true, name: true, sessionName: true, businessType: true, tenantId: true }
    });
    console.log('OUTPUT_START');
    console.log(JSON.stringify(bots));
    console.log('OUTPUT_END');
  } catch (err) {
    console.error('PROB:' + err.message);
  } finally {
    process.exit(0);
  }
}
main();
