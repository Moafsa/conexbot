/**
 * Price detector for extracting monetary values from text
 */

export interface PriceMatch {
    value: number; // in cents
    original: string; // original text (e.g., "R$ 50,00")
    context: string; // surrounding text for context
}

/**
 * Extract all prices from text
 */
export function extractPrices(text: string): PriceMatch[] {
    const matches: PriceMatch[] = [];

    // Regex for Brazilian currency formats:
    // R$ 50,00 | R$ 50 | 50,00 reais | 50 reais
    const priceRegex = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:reais)?/gi;

    let match;
    while ((match = priceRegex.exec(text)) !== null) {
        const original = match[0];
        const numberStr = match[1];

        // Convert Brazilian format to cents
        // "1.500,50" -> 150050 cents
        const cleaned = numberStr.replace(/\./g, '').replace(',', '.');
        const value = Math.round(parseFloat(cleaned) * 100);

        // Get context (50 chars before and after)
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + match[0].length + 50);
        const context = text.substring(start, end).trim();

        matches.push({ value, original, context });
    }

    return matches;
}

/**
 * Find the most likely price for a product/service mentioned in user message
 */
export function findRelevantPrice(
    userMessage: string,
    knowledgeChunks: string[]
): PriceMatch | null {
    // Extract keywords from user message
    const keywords = userMessage
        .toLowerCase()
        .replace(/[^\w\sà-ú]/g, '')
        .split(/\s+/)
        .filter(w => w.length >= 3);

    let bestMatch: PriceMatch | null = null;
    let bestScore = 0;

    for (const chunk of knowledgeChunks) {
        const prices = extractPrices(chunk);

        for (const price of prices) {
            // Score based on keyword proximity
            const chunkLower = chunk.toLowerCase();
            let score = 0;

            for (const kw of keywords) {
                if (chunkLower.includes(kw)) {
                    score += 1;
                }
            }

            // Boost if price is near keywords
            const contextLower = price.context.toLowerCase();
            for (const kw of keywords) {
                if (contextLower.includes(kw)) {
                    score += 3;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = price;
            }
        }
    }

    return bestScore > 0 ? bestMatch : null;
}
