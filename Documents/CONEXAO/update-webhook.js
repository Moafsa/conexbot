const webhookUrl = "http://host.docker.internal:3001/api/webhooks/whatsapp";
const token = "bot-2cebade3";
const uzapiUrl = "http://localhost:21465/webhook";

async function update() {
    console.log(`Updating internal webhook for token ${token}...`);
    try {
        const res = await fetch(uzapiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token
            },
            body: JSON.stringify({
                webhook: webhookUrl,
                events: ["Message", "ReadReceipt", "Disconnected", "Connected"]
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

update();
