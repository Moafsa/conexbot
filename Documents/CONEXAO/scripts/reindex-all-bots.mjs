import prisma from '../src/lib/prisma.js';
import { KnowledgeService } from '../src/services/engine/knowledge.js';

async function main() {
  const bots = await prisma.bot.findMany({
    select: { id: true, name: true, knowledgeBase: true, scrapedContent: true },
  });

  for (const bot of bots) {
    const hasContent =
      (bot.knowledgeBase?.length || 0) > 50 || (bot.scrapedContent?.length || 0) > 50;
    if (!hasContent) {
      console.log(`skip ${bot.name} (sem base de conhecimento)`);
      continue;
    }
    console.log(`reindex ${bot.name}...`);
    const result = await KnowledgeService.reindex(bot.id);
    console.log(`  ok: ${JSON.stringify(result)}`);
  }

  const count = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "VectorStore"`;
  console.log(`VectorStore total: ${count[0]?.n ?? 0}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
