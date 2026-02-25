
import prisma from '@/lib/prisma';
import { VectorService } from './vector';
import { chunkKnowledge } from './knowledge-rag';

export const KnowledgeService = {
    /**
     * Reindexes all bot knowledge (scraped content + uploaded files) into the Vector Store
     */
    async reindex(botId: string) {
        try {
            console.log(`[KnowledgeService] Starting reindex for bot: ${botId}`);

            const bot = await prisma.bot.findUnique({
                where: { id: botId },
                include: {
                    media: {
                        where: { NOT: { extractedText: null } }
                    }
                }
            });

            if (!bot) {
                console.error(`[KnowledgeService] Bot not found: ${botId}`);
                return;
            }

            // 1. Prepare Content
            const scrapedContent = bot.scrapedContent || '';
            const knowledgeBase = bot.knowledgeBase || '';
            const filesContent = bot.media.map(m => m.extractedText as string);

            // 2. Chunking
            const chunks = chunkKnowledge(knowledgeBase, scrapedContent, filesContent);
            console.log(`[KnowledgeService] Generated ${chunks.length} chunks for bot ${botId}`);

            if (chunks.length === 0) {
                console.log(`[KnowledgeService] No content to index for bot ${botId}`);
                return;
            }

            // 3. Clear existing vectors for this bot
            await prisma.$executeRaw`
                DELETE FROM "VectorStore" WHERE "botId" = ${botId}
            `;
            console.log(`[KnowledgeService] Old vectors cleared`);

            // 4. Generate and save new embeddings
            let count = 0;
            for (const chunk of chunks) {
                await VectorService.addDocument(botId, chunk, {
                    source: 'reindex',
                    timestamp: new Date().toISOString()
                });
                count++;
            }

            console.log(`[KnowledgeService] Successfully indexed ${count} documents for bot ${botId}`);

            return { success: true, count };
        } catch (error) {
            console.error(`[KnowledgeService] Reindex error:`, error);
            throw error;
        }
    }
};
