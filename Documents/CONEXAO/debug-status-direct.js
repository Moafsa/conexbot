
const UZAPI_URL = 'http://localhost:21465';
const ADMIN_TOKEN = '725e347d-98a0-439f-8cfd-fba1de062798';

async function check() {
    const sessions = ['bot_1', 'bot_2', '69e5d71c-4318-4775-ad3f-e1c567a57a8a'];
    
    for (const session of sessions) {
        try {
            const res = await fetch(`${UZAPI_URL}/session/status/${session}`, {
                headers: { 'token': ADMIN_TOKEN }
            });
            const data = await res.json();
            console.log(`[${session}] Status:`, JSON.stringify(data.data));
        } catch (e) {
            console.error(`[${session}] Error:`, e.message);
        }
    }
}

check();
