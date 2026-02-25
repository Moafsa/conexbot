const fetch = require('node-fetch');

async function test() {
    try {
        console.log('Testing WuzAPI connection...');
        const res = await fetch('http://localhost:21465/admin/users', {
            headers: { 'Authorization': 'admin_token_123' }
        });
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Users:', JSON.stringify(data, null, 2));
        } else {
            console.log('Error:', await res.text());
        }
    } catch (e) {
        console.error('Connection failed:', e.message);
    }
}

test();
