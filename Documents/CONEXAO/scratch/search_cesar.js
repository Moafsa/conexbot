const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = "postgresql://admin:CHANGE_ME@localhost:5434/conext_db?schema=public";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEARCHING CONTACTS ===");
  const contacts = await prisma.contact.findMany({
    take: 100,
    orderBy: { updatedAt: 'desc' }
  });
  console.log(`Found ${contacts.length} contacts:`);
  for (const c of contacts) {
    console.log(`- ID: ${c.id}, Name: ${c.name}, PushName: ${c.pushName}, Phone: ${c.phone}`);
  }

  console.log("\n=== SEARCHING MESSAGES FOR CESAR OR GAS ===");
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { content: { contains: 'cesar', mode: 'insensitive' } },
        { content: { contains: 'gás', mode: 'insensitive' } },
        { content: { contains: 'gas', mode: 'insensitive' } },
        { content: { contains: 'César', mode: 'insensitive' } },
      ]
    },
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      contact: true
    }
  });
  console.log(`Found ${messages.length} messages.`);
  for (const m of messages) {
    console.log(`[${m.createdAt.toISOString()}] [FromMe: ${m.fromMe}] Contact: ${m.contact?.name || m.contactId} (${m.contact?.phone})`);
    console.log(`  Content: ${m.content}`);
  }

  console.log("\n=== ALL MESSAGES SAMPLE ===");
  const allMessages = await prisma.message.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { contact: true }
  });
  console.log(`Found ${allMessages.length} latest messages total.`);
  for (const m of allMessages) {
    console.log(`[${m.createdAt.toISOString()}] [FromMe: ${m.fromMe}] Contact: ${m.contact?.name || m.contact?.pushName || m.contactId}`);
    console.log(`  ${m.content}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
