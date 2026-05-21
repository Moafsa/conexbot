/**
 * Standalone BullMQ worker for WhatsApp message processing.
 *
 * Run alongside the Next.js app:
 *   npx tsx src/workers/message-worker.ts
 *
 * Or add to docker-compose as a second service using the same image with this command.
 * The worker scales independently from the Next.js web process.
 */
import 'dotenv/config';
import { startMessageWorker } from '@/lib/queue';

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '4', 10);

console.log(`[Worker] Starting message worker (concurrency=${concurrency})...`);

const worker = startMessageWorker(concurrency);

worker.on('ready', () => {
    console.log('[Worker] Ready. Listening for jobs...');
});

worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed for ${job.data.senderPhone}`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
});

process.on('SIGTERM', async () => {
    console.log('[Worker] SIGTERM received, shutting down gracefully...');
    await worker.close();
    process.exit(0);
});
