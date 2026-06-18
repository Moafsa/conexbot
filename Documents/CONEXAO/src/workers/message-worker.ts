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
import { startMessageWorker, startAuditWorker } from '@/lib/queue';
import { logger } from '@/lib/logger';

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '4', 10);

logger.info(`[Worker] Starting workers (concurrency=${concurrency})...`);

const msgWorker = startMessageWorker(concurrency);
const auditWorker = startAuditWorker(2);

msgWorker.on('ready', () => {
    logger.info('[Worker] Message worker ready. Listening for jobs...');
});

msgWorker.on('completed', (job) => {
    logger.info(`[Worker] Job ${job.id} completed for ${job.data.senderPhone}`);
});

msgWorker.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${err.message}`);
});

process.on('SIGTERM', async () => {
    logger.info('[Worker] SIGTERM received, shutting down gracefully...');
    await msgWorker.close();
    await auditWorker.close();
    process.exit(0);
});
