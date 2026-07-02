import { Queue, Worker, Job } from 'bullmq';
import { getRedis } from './redis';

export interface MessageJob {
    sessionName: string;
    senderPhone: string;
    messageText: string;
    channel: 'whatsapp' | 'simulator' | 'generic' | 'wordpress' | 'meta_whatsapp' | 'instagram';
    searchBy: 'sessionName' | 'id';
    inputType: 'text' | 'audio' | 'image';
    mediaPath?: string;
    whatsappChatJid?: string;
    chatwootConversationId?: number;
}

const QUEUE_NAME = 'message-processing';

const JOB_RETENTION = {
    removeOnComplete: { count: 50, age: 3600 },
    removeOnFail: { count: 100, age: 86_400 },
} as const;

let messageQueue: Queue<MessageJob> | null = null;

export function getMessageQueue(): Queue<MessageJob> {
    if (!messageQueue) {
        messageQueue = new Queue<MessageJob>(QUEUE_NAME, {
            connection: getRedis(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                ...JOB_RETENTION,
            },
        });
    }
    return messageQueue;
}

/** Enqueue a message for processing. jobId prevents duplicate processing of the same message. */
export async function enqueueMessage(job: MessageJob, jobId?: string): Promise<void> {
    const queue = getMessageQueue();
    await queue.add('process', job, {
        jobId,
        // If a job with the same ID already exists (same message re-delivered), skip
        // BullMQ ignores duplicate jobIds when they are in waiting/active state
    });
}

/** Start the BullMQ worker — call this from src/workers/message-worker.ts only. */
export function startMessageWorker(concurrency = 4): Worker<MessageJob> {
    const worker = new Worker<MessageJob>(
        QUEUE_NAME,
        async (job: Job<MessageJob>) => {
            const { MessageProcessor } = await import('@/services/engine/processor');
            const { sessionName, senderPhone, messageText, channel, searchBy, inputType, mediaPath, whatsappChatJid, chatwootConversationId } = job.data;
            await MessageProcessor.process(sessionName, senderPhone, messageText, channel, searchBy, {
                inputType,
                mediaPath,
                whatsappChatJid,
                chatwootConversationId,
            });
        },
        {
            connection: getRedis(),
            concurrency,
            ...JOB_RETENTION,
        }
    );

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    return worker;
}

// ─── AUDIT / RAIO-X QUEUE ─────────────────────────────────────────────

export interface AuditJob {
    clientId: string;
    agencyId: string;
}

const AUDIT_QUEUE_NAME = 'audit-processing';
let auditQueue: Queue<AuditJob> | null = null;

export function getAuditQueue(): Queue<AuditJob> {
    if (!auditQueue) {
        auditQueue = new Queue<AuditJob>(AUDIT_QUEUE_NAME, {
            connection: getRedis(),
            defaultJobOptions: {
                attempts: 1, // Let's not retry AI tasks blindly to save money
                ...JOB_RETENTION,
            },
        });
    }
    return auditQueue;
}

export async function enqueueAudit(job: AuditJob): Promise<string> {
    const queue = getAuditQueue();
    const result = await queue.add('audit', job);
    return result.id as string;
}

export function startAuditWorker(concurrency = 2): Worker<AuditJob> {
    const worker = new Worker<AuditJob>(
        AUDIT_QUEUE_NAME,
        async (job: Job<AuditJob>) => {
            const { processAuditJob } = await import('@/workers/audit-worker');
            await processAuditJob(job);
        },
        {
            connection: getRedis(),
            concurrency,
            ...JOB_RETENTION,
        }
    );

    worker.on('failed', (job, err) => {
        const logger = require('@/lib/logger').logger;
        logger.error({ jobId: job?.id, err }, `[AuditWorker] Job falhou`);
    });

    return worker;
}

