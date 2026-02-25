import OpenAI from 'openai';
import prisma from '@/lib/prisma';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const VectorService = {
    /**
     * Generate embedding for a given text using OpenAI
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // Clean text to avoid token limits or empty strings
            const cleanText = text.replace(/\n/g, ' ').trim();
            if (!cleanText) return [];

            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: cleanText,
                dimensions: 1536,
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('[VectorService] Error generating embedding:', error);
            return [];
        }
    },

    /**
     * Add a document to the vector store
     */
    async addDocument(botId: string, content: string, metadata: any = {}) {
        const embedding = await this.generateEmbedding(content);
        if (!embedding.length) return null;

        // We use a raw query because Prisma implementation of vector types is still experimental in some versions
        // But since we enabled the extension, let's try standard create first if typed correctly, 
        // or fallback to raw query for the vector field.

        // For now, using $executeRaw for the vector insertion to be safe with pgvector syntax
        const vectorString = `[${embedding.join(',')}]`;

        await prisma.$executeRaw`
      INSERT INTO "VectorStore" ("id", "content", "metadata", "embedding", "botId", "createdAt")
      VALUES (gen_random_uuid(), ${content}, ${metadata}, ${vectorString}::vector, ${botId}, NOW())
    `;

        console.log('[VectorService] Document added to store');
    },

    /**
     * Search for similar documents
     */
    async searchSimilar(botId: string, query: string, limit = 3) {
        const embedding = await this.generateEmbedding(query);
        if (!embedding.length) return [];

        const vectorString = `[${embedding.join(',')}]`;

        // Perform similarity search using cosine distance (<=>)
        // We select text and metadata, ordered by distance
        const results = await prisma.$queryRaw`
      SELECT id, content, metadata, 1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "VectorStore"
      WHERE "botId" = ${botId}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;

        return results as Array<{ id: string; content: string; metadata: any; similarity: number }>;
    }
};
