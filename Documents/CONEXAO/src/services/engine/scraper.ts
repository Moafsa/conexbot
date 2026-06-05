import * as cheerio from 'cheerio';
import FirecrawlApp from '@mendable/firecrawl-js';

const MAX_CONTENT_LENGTH = 25000; // Increased from 8000 to keep footer data
const FETCH_TIMEOUT_MS = 20000; // Increased from 10000
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';

export interface ScrapeResult {
    content: string;
    title: string;
    success: boolean;
    error?: string;
}

export async function scrapeWebsite(url: string, retryCount = 0): Promise<ScrapeResult> {
    try {
        const validUrl = new URL(url);
        if (!['http:', 'https:'].includes(validUrl.protocol)) {
            return { content: '', title: '', success: false, error: 'Invalid protocol' };
        }

        // 1. Try Firecrawl first
        try {
            console.log(`[Scraper] Attempting to scrape with Firecrawl: ${url}`);
            const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
            const scrapeResult = await app.scrapeUrl(url, { formats: ['markdown'] }) as any;
            
            if (scrapeResult.success && scrapeResult.markdown) {
                console.log(`[Scraper] Firecrawl success for ${url}`);
                const title = scrapeResult.metadata?.title || validUrl.hostname;
                let content = scrapeResult.markdown.trim();
                
                if (content.length > MAX_CONTENT_LENGTH) {
                    content = content.substring(0, Math.floor(MAX_CONTENT_LENGTH * 0.8)) + 
                        '\n\n[...conteúdo truncado...]\n\n' + 
                        content.substring(content.length - Math.floor(MAX_CONTENT_LENGTH * 0.2));
                }
                
                return { content, title, success: true };
            }
        } catch (fcError: any) {
            console.warn(`[Scraper] Firecrawl failed, falling back to Cheerio:`, fcError.message);
        }

        // 2. Fallback to Cheerio (fetch)
        console.log(`[Scraper] Executing Cheerio fallback for ${url}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Better User-Agent
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            },
        });

        clearTimeout(timeout);

        if (!response.ok) {
            // Retry logic for 5xx errors or specific 4xx
            if (retryCount < 1 && (response.status >= 500 || response.status === 429)) {
                console.log(`[Scraper] Retrying ${url} (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return scrapeWebsite(url, retryCount + 1);
            }
            return { content: '', title: '', success: false, error: `HTTP ${response.status}` };
        }

        const html = await response.text();
        return parseHtml(html);
    } catch (error: any) {
        const message = error.name === 'AbortError' ? 'Timeout' : error.message;

        if (retryCount < 1 && message === 'Timeout') {
            console.log(`[Scraper] Retrying timeout ${url} (attempt ${retryCount + 1})...`);
            return scrapeWebsite(url, retryCount + 1);
        }

        return { content: '', title: '', success: false, error: message };
    }
}

function parseHtml(html: string): ScrapeResult {
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, nav, iframe, noscript, svg, form, button, input').remove();
    $('[role="navigation"], [role="banner"]').remove();

    // Extract Metadata
    const title = $('title').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        $('h1').first().text().trim() || '';

    const description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') || '';

    const contentParts: string[] = [];

    if (description) {
        contentParts.push(`\n**Descrição do Site:** ${description}\n`);
    }

    // Extract Schema.org JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '{}');
            if (json['@type'] === 'Restaurant' || json['@type'] === 'LocalBusiness' || json['@type'] === 'Product') {
                contentParts.push(`\n**Dados Estruturados (${json['@type']}):**`);
                if (json.name) contentParts.push(`- Nome: ${json.name}`);
                if (json.telephone) contentParts.push(`- Telefone: ${json.telephone}`);
                if (json.address) {
                    const addr = typeof json.address === 'string' ? json.address :
                        `${json.address.streetAddress || ''}, ${json.address.addressLocality || ''}`;
                    contentParts.push(`- Endereço: ${addr}`);
                }
                if (json.priceRange) contentParts.push(`- Faixa de Preço: ${json.priceRange}`);
                if (json.menu) contentParts.push(`- Cardápio: ${json.menu}`);
            }
        } catch (e) {
            // ignore invalid json
        }
    });

    // Extract headings, paragraphs, and lists
    $('h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, figcaption, div, span, strong, b').each((_, el) => {
        // Skip if inside navigation explicitly
        if ($(el).parents('nav').length > 0) return;

        const text = $(el).text().trim().replace(/\s+/g, ' ');
        const tag = (el as any).tagName?.toLowerCase() || '';

        // Filter noise: simple text checks
        if (!text || text.length < 2) return;

        // Smart extraction for Prices and Contacts
        const isPrice = /R\$\s*\d+/.test(text) || /\d{2,}\s*reais/i.test(text);
        const isLabel = /^(Data|Local|Horário|Endereço|Tel|WhatsApp|Bairro|CEP|Cidade|Estado):/i.test(text);
        const isContact = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/.test(text);
        const isAddressKeyword = /rua|avenida|av\.|av |rodovia|bairro|centro|cep/i.test(text);

        // Keep meaningful content
        if (['div', 'span'].includes(tag) && !isPrice && !isLabel && !isContact && !isAddressKeyword && text.length < 15) {
            return;
        }

        const hasDirectText = $(el).contents().filter((_, node) => node.type === 'text' && $(node).text().trim().length > 0).length > 0;

        if (!hasDirectText && !isPrice && !isContact && !isAddressKeyword && !isLabel) {
            return;
        }

        if (tag.startsWith('h')) {
            contentParts.push(`\n## ${text}`);
        } else if (tag === 'li') {
            contentParts.push(`- ${text}`);
        } else if (tag === 'strong' || tag === 'b') {
            contentParts.push(`**${text}**`);
        } else {
            contentParts.push(text);
        }
    });

    let content = contentParts
        .filter((line, i, arr) => arr.indexOf(line) === i) // dedupe
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Truncate if too long (Smart truncation)
    if (content.length > MAX_CONTENT_LENGTH) {
        // Try to keep the beginning and end, or just cut
        content = content.substring(0, Math.floor(MAX_CONTENT_LENGTH * 0.8)) + 
            '\n\n[...conteúdo truncado...]\n\n' + 
            content.substring(content.length - Math.floor(MAX_CONTENT_LENGTH * 0.2));
    }

    return { content, title, success: content.length > 0 };
}
