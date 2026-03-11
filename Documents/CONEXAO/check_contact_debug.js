
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const phone = '555497092223';
    const contacts = await prisma.contact.findMany({
      where: { phone },
      include: {
        bot: { select: { name: true } },
        assignedBot: { select: { name: true } }
      }
    });
    console.log('CONTACTS_INFO:' + JSON.stringify(contacts));
  } catch (e) {
    console.error('ERROR:' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
