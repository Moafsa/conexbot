import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '..', '.env') });

import prisma from '../src/lib/prisma';

async function main() {
    const bots = await prisma.bot.findMany();
    console.log('All bots in db:', bots.map(b => ({ id: b.id, name: b.name, businessType: b.businessType, tenantId: b.tenantId })));
}

main();
