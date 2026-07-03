
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

            // 2. Query ClientAudits (Raio-X) and ClientTasks for Graph RAG context
            const clientAudits = await prisma.clientAudit.findMany({
                where: { clientId: bot.tenantId },
                orderBy: { createdAt: 'desc' },
                take: 3
            });

            const clientTasks = await prisma.clientTask.findMany({
                where: { clientId: bot.tenantId },
                orderBy: { status: 'asc' },
                take: 10
            });

            let auditsText = '';
            for (const audit of clientAudits) {
                auditsText += `Relatório de Raio-X (Auditoria) do dia ${audit.createdAt.toLocaleDateString()}:\n`;
                auditsText += `Pontuação Geral de Marketing: ${audit.overallScore}/100\n`;
                if (audit.report) {
                    const r = audit.report as any;
                    if (r.copy) auditsText += `- Copy Squad Feedback: Problemas: ${JSON.stringify(r.copy.problems || [])}. Soluções: ${JSON.stringify(r.copy.solutions || [])}\n`;
                    if (r.brand) auditsText += `- Brand Squad Feedback: Problemas: ${JSON.stringify(r.brand.problems || [])}. Soluções: ${JSON.stringify(r.brand.solutions || [])}\n`;
                    if (r.traffic) auditsText += `- Traffic Masters Feedback: Problemas: ${JSON.stringify(r.traffic.problems || [])}. Soluções: ${JSON.stringify(r.traffic.solutions || [])}\n`;
                    if (r.strategy) auditsText += `- Hormozi Squad Feedback: Problemas: ${JSON.stringify(r.strategy.problems || [])}. Soluções: ${JSON.stringify(r.strategy.solutions || [])}\n`;
                }
                auditsText += '\n';
            }

            let tasksText = '';
            for (const task of clientTasks) {
                tasksText += `- Tarefa da Agência: "${task.title}" para o Squad "${task.squadId}" pelo Agente "${task.agentId}" está com Status "${task.status}". Descrição: ${task.description || 'Nenhuma'}\n`;
            }

            // 3. Chunking
            const chunks = chunkKnowledge(knowledgeBase, scrapedContent, filesContent);
            console.log(`[KnowledgeService] Generated ${chunks.length} chunks for bot ${botId}`);

            // 4. Extract Graph triples for Graph RAG (Graphify)
            const combinedText = `${knowledgeBase}\n\n${scrapedContent}\n\n${auditsText}\n\n${tasksText}`;
            const graphTriples = await GraphRAGHelper.extractTriples(combinedText);
            console.log(`[KnowledgeService] Extracted ${graphTriples.length} Graph RAG relations including audits/tasks`);

            // 5. Clear existing vectors for this bot
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
