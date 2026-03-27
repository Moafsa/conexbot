
import fs from 'fs';
import path from 'path';
import https from 'https';
import { StorageService } from '../lib/storage';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const logos = [
    { name: "whatsapp", url: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg", type: "image/svg+xml" },
    { name: "wordpress", url: "https://upload.wikimedia.org/wikipedia/commons/9/93/Wordpress_Blue_logo.svg", type: "image/svg+xml" },
    { name: "uzapi", url: "https://uzapi.com.br/wp-content/uploads/2022/03/uzapi-logo-dark.png", type: "image/png" },
    { name: "asaas", url: "https://asaas.com/assets/img/logo-asaas.svg", type: "image/svg+xml" },
    { name: "google", url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg", type: "image/svg+xml" },
    { name: "calendar", url: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg", type: "image/svg+xml" },
    { name: "openai", url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg", type: "image/svg+xml" },
    { name: "gemini", url: "https://www.gstatic.com/lamda/images/favicon_v2_16x16.png", type: "image/png" },
    { name: "openrouter", url: "https://openrouter.ai/favicon.ico", type: "image/x-icon" },
    { name: "elevenlabs", url: "https://elevenlabs.io/static/img/logo.png", type: "image/png" },
    { name: "stripe", url: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg", type: "image/svg+xml" },
    { name: "chatwoot", url: "https://www.chatwoot.com/images/logo/logo.svg", type: "image/svg+xml" },
    { name: "n8n", url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/N8n_logo.svg", type: "image/svg+xml" },
    { name: "react", url: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg", type: "image/svg+xml" },
    { name: "postgres", url: "https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg", type: "image/svg+xml" },
    { name: "minio", url: "https://min.io/resources/img/logo.svg", type: "image/svg+xml" },
    { name: "nextjs", url: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Nextjs-logo.svg", type: "image/svg+xml" },
    { name: "conext", url: "https://www.conext.click/img/logo.svg", type: "image/svg+xml" },
];

async function downloadFile(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
                return;
            }
            const data: any[] = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
}

async function run() {
    console.log("Starting logo ingestion to Minio...");
    const results: Record<string, string> = {};

    for (const logo of logos) {
        try {
            console.log(`Processing ${logo.name}...`);
            const buffer = await downloadFile(logo.url);
            const ext = logo.url.split('.').pop() || 'png';
            const filename = `integrations/${logo.name}.${ext}`;
            const publicUrl = await StorageService.uploadFile(buffer, filename, logo.type);
            results[logo.name] = publicUrl;
            console.log(`✓ Uploaded ${logo.name} to ${publicUrl}`);
        } catch (error) {
            console.error(`✗ Error processing ${logo.name}:`, error);
        }
    }

    const configPath = path.join(__dirname, '../config/integrations.json');
    if (!fs.existsSync(path.dirname(configPath))) fs.mkdirSync(path.dirname(configPath));
    fs.writeFileSync(configPath, JSON.stringify(results, null, 2));
    console.log(`\nSuccessfully saved ${Object.keys(results).length} logo URLs to ${configPath}`);
}

run().catch(console.error);
