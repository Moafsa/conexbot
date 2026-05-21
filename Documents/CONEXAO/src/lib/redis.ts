import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        const url = process.env.REDIS_URL || 'redis://localhost:6380';
        redis = new Redis(url, {
            maxRetriesPerRequest: null, // required by BullMQ
            enableReadyCheck: false,
            lazyConnect: true,
        });
        redis.on('error', (err) => {
            console.error('[Redis] Connection error:', err.message);
        });
    }
    return redis;
}

/** Acquire a distributed lock. Returns true if acquired, false if already locked. */
export async function acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const r = getRedis();
    const result = await r.set(`lock:${key}`, '1', 'PX', ttlMs, 'NX');
    return result === 'OK';
}

export async function releaseLock(key: string): Promise<void> {
    const r = getRedis();
    await r.del(`lock:${key}`);
}
