
console.log('Starting verification script...');
try {
    const pkg = require('@prisma/client');
    console.log('Package `@prisma/client` loaded.');
    console.log('Exports:', Object.keys(pkg));

    const { PrismaClient } = pkg;
    if (!PrismaClient) {
        console.error('CRITICAL: PrismaClient not found in package export!');
        process.exit(1);
    }

    console.log('Initializing PrismaClient...');
    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });

    // Check if models exist on the instance
    const keys = Object.keys(prisma);
    console.log('Prisma Instance Keys (partial):', keys.slice(0, 10));

    if (!prisma.tenant) {
        console.error('CRITICAL: `prisma.tenant` is UNDEFINED. Models were not generated into the client.');
        console.log('Did you run `npx prisma generate`?');
        process.exit(1);
    } else {
        console.log('`prisma.tenant` model delegate found.');
    }

    console.log('Attempting to connect and query...');
    prisma.tenant.findFirst().then(t => {
        console.log('✅ SUCCESS: Database Connection and Query worked!');
        console.log('Tenant found:', t ? `ID: ${t.id}` : 'None (Table empty)');
        process.exit(0);
    }).catch(e => {
        console.error('❌ QUERY FAILED:', e);
        process.exit(1);
    });

} catch (e) {
    console.error('❌ SCRIPT CRASHED:', e);
    process.exit(1);
}
