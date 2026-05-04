import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const key = process.env.OPENAI_API_KEY || "SUA_CHAVE_AQUI";
    
    await prisma.globalConfig.upsert({
        where: { id: 'system' },
        update: { openaiApiKey: key },
        create: { id: 'system', openaiApiKey: key }
    });

    console.log("OpenAI API Key atualizada com sucesso!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
