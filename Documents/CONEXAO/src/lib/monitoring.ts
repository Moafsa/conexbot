/**
 * Lightweight error reporting wrapper.
 * When SENTRY_DSN is set, sends errors to Sentry.
 * Always logs to console.error so Docker logs capture it.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

async function getSentry() {
    if (!process.env.SENTRY_DSN) return null;
    if (!Sentry) {
        // Dynamic require avoids compile-time dependency on @sentry/nextjs types
        try { Sentry = require('@sentry/nextjs'); } catch { return null; }
    }
    return Sentry;
}

export async function captureError(err: unknown, context?: Record<string, unknown>) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Error]', message, context ?? '');

    const s = await getSentry();
    if (s?.withScope) {
        s.withScope((scope: any) => {
            if (context) scope.setExtras(context);
            s.captureException(err);
        });
    }
}

export async function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`[${level.toUpperCase()}]`, msg);
    const s = await getSentry();
    if (s?.captureMessage) s.captureMessage(msg, level);
}
