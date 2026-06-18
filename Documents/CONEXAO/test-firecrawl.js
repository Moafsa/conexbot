const FirecrawlApp = require('@mendable/firecrawl-js').default;
const FIRECRAWL_API_KEY = 'fc-ca0d960e8d124dfba344739c74ed6a21';

async function test() {
    try {
        const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
        const scrapeResult = await app.scrapeUrl('https://divsys.conext.click/index.php?view=cardapio_online&tenant=4&filial=4', { formats: ['markdown'] });
        console.log(scrapeResult.markdown);
    } catch(e) {
        console.error(e.message);
    }
}
test();
