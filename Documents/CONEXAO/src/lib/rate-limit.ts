// Simple in-memory rate limiter (upgrade to Redis in production at scale)

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetTime) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function rateLimit(
    key: string,
    maxRequests: number = 60,
    windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
        store.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    entry.count++;

    if (entry.count > maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

// Pre-configured limiters for different endpoints
export const apiLimiter = (ip: string) => rateLimit(`api:${ip}`, 100, 60000);
export const authLimiter = (ip: string) => rateLimit(`auth:${ip}`, 10, 60000);
export const webhookLimiter = (ip: string) => rateLimit(`webhook:${ip}`, 300, 60000);
