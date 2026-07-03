
import prisma from '@/lib/prisma';
import { VectorService } from './vector';
import { chunkKnowledge } from './knowledge-rag';
import { GraphRAGHelper } from './graph-rag-helper';

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

            // 3. Extract Graph triples for Graph RAG (Graphify)
            const combinedText = `${knowledgeBase}\n\n${scrapedContent}`;
            const graphTriples = await GraphRAGHelper.extractTriples(combinedText);
            console.log(`[KnowledgeService] Extracted ${graphTriples.length} Graph RAG relations`);

            // 4. Clear existing vectors for this bot
            await prisma.$executeRaw`
                DELETE FROM "VectorStore" WHERE "botId" = ${botId}
            `;
            console.log(`[KnowledgeService] Old vectors cleared`);

            // 5. Generate and save new embeddings
            let count = 0;
            
            // Index standard chunks
            for (const chunk of chunks) {
                await VectorService.addDocument(botId, chunk, {
                    source: 'reindex',
                    type: 'chunk',
                    timestamp: new Date().toISOString()
                });
                count++;
            }

            // Index Graph RAG relationships
            for (const rel of graphTriples) {
                const relationText = `Grafo: [${rel.source}] --(${rel.predicate})--> [${rel.target}] : ${rel.context}`;
                await VectorService.addDocument(botId, relationText, {
                    source: 'graph-rag',
                    type: 'relation',
                    sourceEntity: rel.source.toLowerCase().trim(),
                    predicate: rel.predicate.toLowerCase().trim(),
                    targetEntity: rel.target.toLowerCase().trim(),
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
