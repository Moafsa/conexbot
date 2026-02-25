
import { Product } from '@prisma/client';

export const ProductSelector = {
    findProduct(userMessage: string, products: Product[]): Product | null {
        if (!products || products.length === 0) return null;

        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const msg = normalize(userMessage);

        // 1. Direct Name Match (Fuzzy)
        let bestMatch: Product | null = null;
        let maxScore = 0;

        for (const product of products) {
            const prodName = normalize(product.name);
            const prodDesc = normalize(product.description || "");

            let score = 0;

            if (msg.includes(prodName)) score += 10;
            else {
                // Check words
                const words = prodName.split(/\s+/);
                let matchedWords = 0;
                for (const w of words) {
                    if (w.length > 2 && msg.includes(w)) matchedWords++;
                }
                if (matchedWords > 0) score += matchedWords * 2;
            }

            // Boost if price is mentioned? Maybe not, complicates things.

            if (score > maxScore && score > 2) {
                maxScore = score;
                bestMatch = product;
            }
        }

        return bestMatch;
    }
};
