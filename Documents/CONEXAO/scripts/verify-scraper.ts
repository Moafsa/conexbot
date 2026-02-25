import { scrapeWebsite } from '../src/services/engine/scraper';

async function testScraper() {
    const url = 'https://www.conexaoenterprise.com.br/conexao-business-fest/comprar';
    console.log(`Testing scraper with ${url}...`);

    try {
        const result = await scrapeWebsite(url);
        console.log('Result:', result);

        if (result.success && result.content.length > 0) {
            console.log('✅ Scraper working!');
            console.log('Content length:', result.content.length);
        } else {
            console.error('❌ Scraper failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Scraper threw error:', error);
    }
}

testScraper();
