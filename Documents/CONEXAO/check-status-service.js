
import { UzapiService } from './src/services/engine/uzapi.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkAll() {
    console.log('Checking WuzAPI Status for all known sessions...');
    const sessions = ['bot_1', 'bot_2', '69e5d71c-4318-4775-ad3f-e1c567a57a8a']; // Add common session names
    
    for (const s of sessions) {
        try {
            const status = await UzapiService.getSessionStatus(s);
            console.log(`Session: ${s} | Status: ${status}`);
        } catch (e) {
            console.log(`Session: ${s} | Error: ${e.message}`);
        }
    }
}

checkAll();
