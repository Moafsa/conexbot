import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || process.env.NEXT_PHASE === 'phase-production-build') {
        // Build time or missing DB: return a client that won't try to connect at top-level
        return new PrismaClient();
    }
    const adapter = new PrismaPg({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma_rel_v2: PrismaClientSingleton | undefined;
};

// Extremely lazy initialization using a Proxy
// This prevents ANY code execution (including adapter init) until a prisma method is actually called.
export const prisma = new Proxy({} as PrismaClientSingleton, {
    get(target, prop, receiver) {
        if (!globalForPrisma.prisma_rel_v2) {
            console.log(`[Prisma] Lazy initializing client for prop: ${String(prop)}`);
            globalForPrisma.prisma_rel_v2 = prismaClientSingleton();
        }
        return Reflect.get(globalForPrisma.prisma_rel_v2, prop, receiver);
    }
});

export default prisma;

if (process.env.NODE_ENV !== 'production') {
    // Note: in dev, we still want to keep the singleton in globalThis
    // Our proxy handles this by checking globalForPrisma.prisma_rel_v2
}
