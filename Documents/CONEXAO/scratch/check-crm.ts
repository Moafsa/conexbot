import fs from 'fs';
import path from 'path';

// Read .env file manually
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        process.env[key] = val;
    }
});

import prisma from '../src/lib/prisma';

async function main() {
    const carts = await prisma.cart.findMany({
        include: {
            items: { include: { product: true } }
        }
    });
    console.log("Total carts in database:", carts.length);
    console.log("Carts:", carts.map(c => ({
        id: c.id,
        botId: c.botId,
        contactPhone: c.contactPhone,
        status: c.status,
        itemsCount: c.items.length,
        items: c.items.map(i => `${i.product?.name} x${i.quantity}`)
    })));
}

main().catch(console.error);
