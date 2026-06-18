const fetch = require('node-fetch');
async function test() {
    console.log('Fetching preview-site API...');
    try {
        const res = await fetch('http://localhost:3000/api/agency/onboarding/preview-site', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://divsys.conext.click/index.php?view=cardapio_online&tenant=4&filial=4' })
        });
        const data = await res.json();
        console.log(JSON.stringify(data.extracted, null, 2));
    } catch(e) {
        console.error(e.message);
    }
}
test();
