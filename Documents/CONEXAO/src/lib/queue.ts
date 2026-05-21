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

let messageQueue: Queue<MessageJob> | null = null;

export function getMessageQueue(): Queue<MessageJob> {
    if (!messageQueue) {
        messageQueue = new Queue<MessageJob>(QUEUE_NAME, {
            connection: getRedis(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 100,
                removeOnFail: 500,
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
        }
    );

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    return worker;
}
