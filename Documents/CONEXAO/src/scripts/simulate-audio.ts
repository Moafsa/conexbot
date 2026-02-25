
import fetch from 'node-fetch';

async function run() {
    const payload = {
        "event_type": "message",
        "instanceId": "1234",
        "id": "1234",
        "referenceId": "1234",
        "data": {
            "id": "1234",
            "from": "5511999999999@c.us",
            "to": "5511888888888@c.us",
            "ack": 0,
            "type": "audio",
            "body": "",
            "media": "http://example.com/audio.ogg",
            "fromMe": false,
            "isForwarded": false,
            "notifyName": "Test User",
            "datetime": 1700000000,
            "author": "5511999999999@c.us",
            "quotedMsgId": null,
            "mentionedIds": [],
            "vCards": [],
            "links": []
        },
        // WuzAPI specific fields based on log
        "file_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Public test audio
        "jsonData": JSON.stringify({
            "event": {
                "Info": {
                    "Sender": "5511999999999@s.whatsapp.net",
                    "FromMe": false
                },
                "Message": {
                    "audioMessage": {
                        "url": "" // Intentionally empty to test fallback
                    }
                }
            }
        })
    };

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response body:', text);
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
