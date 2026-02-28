const UZAPI_URL = 'http://127.0.0.1:21465';
const ADMIN_TOKEN = 'admin_token_123';
const sessionName = 'debug-session-' + Date.now();

async function testWuzAPI() {
    try {
        console.log("1. Creating User");
        const createRes = await fetch(`${UZAPI_URL}/admin/users`, {
            method: 'POST',
            headers: { 'Authorization': ADMIN_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: sessionName, token: sessionName, webhook: "", expiration: 0, events: "Message" })
        });
        console.log("Create user status:", createRes.status, await createRes.text());

        console.log("2. Starting Session");
        const connectRes = await fetch(`${UZAPI_URL}/session/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Token': sessionName },
            body: JSON.stringify({ Subscribe: ["Message"], Immediate: false })
        });
        console.log("Start session status:", connectRes.status, await connectRes.text());

        console.log("Waiting 10 seconds for QR to generate...");
        await new Promise(r => setTimeout(r, 10000));

        console.log("3. Getting QR");
        const qrRes = await fetch(`${UZAPI_URL}/session/qr`, {
            headers: { 'Token': sessionName }
        });
        console.log("QR status:", qrRes.status, await qrRes.text());

    } catch (e) {
        console.error("Error:", e.message);
    }
}
testWuzAPI();
