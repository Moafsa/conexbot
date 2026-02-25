
import { scrapeWebsite } from '../services/engine/scraper';

async function test() {
    const url = 'https://www.conexaoenterprise.com.br/conexao-business-fest/comprar';
    console.log(`Scraping ${url}...`);

    try {
        const result = await scrapeWebsite(url);
        console.log('--- TITLE ---');
        console.log(result.title);
        console.log('--- CONTENT ---');
        console.log(result.content);
        console.log('--- END ---');

        if (result.content.includes('10.000')) {
            console.log('FOUND "10.000" in content!');
        } else {
            console.log('"10.000" NOT FOUND in content.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
