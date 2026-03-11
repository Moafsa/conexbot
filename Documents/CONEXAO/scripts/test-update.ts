import prisma from './src/lib/prisma';

async function main() {
    const id = '9ba31a1e-4c84-400d-a59e-55578d05fcd8';
    console.log('--- TESTING UPDATE FOR BOT', id, '---');

    try {
        const updatedBot = await prisma.bot.update({
            where: { id },
            data: {
                name: "Bibiana Test",
                chatwootUrl: "https://chatwoot.falecomogoogle.com.br",
                chatwootToken: "xyz-789",
                chatwootAccountId: "1"
            }
        });
        console.log('Prisma Update: SUCCESS');
        console.log('Updated Name:', updatedBot.name);

        // Test Reindex
        console.log('Testing Reindex...');
        const { KnowledgeService } = await import('./src/services/engine/knowledge');
        await KnowledgeService.reindex(id);
        console.log('Reindex: SUCCESS');

    } catch (error: any) {
        console.error('TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
