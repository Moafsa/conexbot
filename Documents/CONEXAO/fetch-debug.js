const sessionName = 'bot-5f298db8';
const url = `http://localhost:3000/api/debug/bot-data?sessionName=${sessionName}`;

async function fetchDebug() {
    try {
        console.log(`Fetching from ${url}...`);
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Status ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

fetchDebug();
