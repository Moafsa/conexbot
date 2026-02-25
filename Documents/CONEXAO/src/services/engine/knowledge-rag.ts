const MAX_CHUNKS = 5;
const MAX_TOTAL_CHARS = 1200;
const MIN_CHUNK_LENGTH = 20;

interface ScoredChunk {
    text: string;
    score: number;
}

export function chunkKnowledge(
    knowledgeBase: string | null,
    scrapedContent: string | null,
    materialsText?: string[] // NEW: Text extracted from PDFs/images
): string[] {
    const sources = [
        knowledgeBase,
        scrapedContent,
        ...(materialsText || []),
    ].filter(Boolean);

    const combined = sources.join('\n\n');
    if (!combined.trim()) return [];

    // Split by double newlines, headings, or section separators
    const rawChunks = combined
        .split(/(?:\n\s*\n|\n(?=##?\s)|(?:═{3,}|─{3,}|={3,}|-{3,}))/)
        .map(c => c.trim())
        .filter(c => c.length >= MIN_CHUNK_LENGTH);

    // Merge very short chunks with their neighbor
    const merged: string[] = [];
    let buffer = '';
    for (const chunk of rawChunks) {
        if (buffer.length + chunk.length < 300) {
            buffer += (buffer ? '\n' : '') + chunk;
        } else {
            if (buffer) merged.push(buffer);
            buffer = chunk;
        }
    }
    if (buffer) merged.push(buffer);

    return merged;
}

export function retrieveRelevantChunks(
    chunks: string[],
    userMessage: string,
    maxChunks: number = MAX_CHUNKS
): string {
    if (chunks.length === 0) return '';

    // Tokenize user message into keywords (lowercased, unique, 3+ chars)
    const stopWords = new Set([
        'que', 'com', 'para', 'por', 'uma', 'como', 'mais', 'mas', 'nos',
        'das', 'dos', 'tem', 'esse', 'essa', 'isso', 'este', 'esta', 'isto',
        'você', 'voce', 'não', 'nao', 'sim', 'sobre', 'qual', 'quais',
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
        'her', 'was', 'one', 'our', 'out', 'muito', 'pode', 'aqui',
    ]);

    const keywords = [...new Set(
        userMessage
            .toLowerCase()
            .replace(/[^\w\sà-ú@]/g, '')
            .split(/\s+/)
            .filter(w => w.length >= 3 && !stopWords.has(w))
    )];

    if (keywords.length === 0) {
        // No useful keywords: return first chunks as general context
        // IMPROVED: Return more chunks to ensure context on generic greetings like "como funciona"
        return chunks.slice(0, Math.min(4, maxChunks))
            .join('\n\n')
            .substring(0, MAX_TOTAL_CHARS);
    }

    // Score chunks by keyword overlap
    const scored: ScoredChunk[] = chunks.map(chunk => {
        const chunkLower = chunk.toLowerCase();
        let score = 0;

        for (const kw of keywords) {
            // Exact word match (higher value)
            const wordBoundary = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'gi');
            const matches = chunkLower.match(wordBoundary);
            if (matches) {
                score += matches.length * 2;
            }

            // Partial match
            if (chunkLower.includes(kw)) {
                score += 1;
            }
        }

        // Boost chunks with special content markers
        if (chunkLower.includes('r$') || chunkLower.includes('preço') || chunkLower.includes('preco')) score += 1;
        if (chunkLower.includes('patrocín') || chunkLower.includes('patrocin') || chunkLower.includes('cota')) score += 1;
        if (chunkLower.includes('link') || chunkLower.includes('http') || chunkLower.includes('www')) score += 1;

        return { text: chunk, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Take top chunks within char limit
    const selected: string[] = [];
    let totalChars = 0;

    for (const { text, score } of scored) {
        if (score === 0 && selected.length > 0) break; // Skip irrelevant chunks if we have some
        if (selected.length >= maxChunks) break;
        if (totalChars + text.length > MAX_TOTAL_CHARS) {
            // Truncate last chunk to fit
            const remaining = MAX_TOTAL_CHARS - totalChars;
            if (remaining > 50) {
                selected.push(text.substring(0, remaining) + '...');
            }
            break;
        }
        selected.push(text);
        totalChars += text.length;
    }

    return selected.join('\n\n');
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
