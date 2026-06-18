const cheerio = require('cheerio');
const fs = require('fs');
const https = require('https');

async function scrapeWebsite(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, iframe, noscript, svg, form, button, input').remove();
    $('[role="navigation"], [role="banner"]').remove();

    const contentParts = [];

    $('h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, figcaption, div, span, strong, b').each((_, el) => {
        if ($(el).parents('nav').length > 0) return;

        const text = $(el).text().trim().replace(/\s+/g, ' ');
        const tag = el.tagName?.toLowerCase() || '';

        if (!text || text.length < 2) return;

        const isPrice = /R\$\s*\d+/.test(text) || /\d{2,}\s*reais/i.test(text);
        const isLabel = /^(Data|Local|Horário|Endereço|Tel|WhatsApp|Bairro|CEP|Cidade|Estado):/i.test(text);
        const isContact = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/.test(text);
        const isAddressKeyword = /rua|avenida|av\.|av |rodovia|bairro|centro|cep/i.test(text);

        if (['div', 'span'].includes(tag) && !isPrice && !isLabel && !isContact && !isAddressKeyword && text.length < 15) {
            return;
        }

        const hasDirectText = $(el).contents().filter((_, node) => node.type === 'text' && $(node).text().trim().length > 0).length > 0;

        if (!hasDirectText && !isPrice && !isContact && !isAddressKeyword && !isLabel) {
            return;
        }

        contentParts.push(text);
    });

    let content = contentParts.filter((line, i, arr) => arr.indexOf(line) === i).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    console.log("=== EXTRACTION RESULT ===");
    console.log(content.includes('AV 25 DE JULHO') ? "ADDRESS FOUND: AV 25 DE JULHO" : "ADDRESS NOT FOUND");
    console.log(content.includes('1956') ? "NUMBER FOUND: 1956" : "NUMBER NOT FOUND");
    console.log(content.includes('Centro') ? "NEIGHBORHOOD FOUND: Centro" : "NEIGHBORHOOD NOT FOUND");
    
    // Save to test-output.txt
    fs.writeFileSync('test-output.txt', content);
    console.log("Output saved to test-output.txt");
}

scrapeWebsite('https://divsys.conext.click/index.php?view=cardapio_online&tenant=4&filial=4');
