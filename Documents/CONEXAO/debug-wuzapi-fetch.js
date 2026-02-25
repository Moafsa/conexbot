
const fetch = globalThis.fetch;
const fs = require('fs');

async function run() {
    // URL from log 21:19:13
    const originalUrl = "http://localhost:5555/files/user_4/3EB0D69E8F4635690825BF.ogg";

    // Rewrite logic from route.ts
    let fetchUrl = originalUrl.replace('localhost', '127.0.0.1');
    fetchUrl = fetchUrl.replace(':5555', ':21465');

    console.log(`Original URL: ${originalUrl}`);
    console.log(`Rewritten URL: ${fetchUrl}`);

    try {
        console.log('Attempting fetch...');
        const response = await fetch(fetchUrl);
        console.log(`Response Status: ${response.status}`);
        console.log(`Response StatusText: ${response.statusText}`);

        if (!response.ok) {
            console.error('Fetch failed!');
            const text = await response.text();
            console.log('Error Body:', text);
            return;
        }

        const buffer = await response.arrayBuffer();
        console.log(`Successfully downloaded ${buffer.byteLength} bytes.`);
        fs.writeFileSync('debug_audio.ogg', Buffer.from(buffer));
        console.log('Saved to debug_audio.ogg');

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

run();
