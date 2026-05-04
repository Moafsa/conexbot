import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const bot = await prisma.bot.findFirst();
    if (bot) {
        console.log(`BOT_ID: ${bot.id}`);
    } else {
        console.log("Nenhum robô encontrado.");
    }
}

main().finally(() => prisma.$disconnect());
