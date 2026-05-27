import { MessageProcessor } from './processor';
import { getRedis } from '@/lib/redis';
import prisma from '@/lib/prisma';

// Redis key helpers
const bufferKey = (k: string) => `buf:msgs:${k}`;
const metaKey = (k: string) => `buf:meta:${k}`;
const timerKey = (k: string) => `buf:timer:${k}`;

// In-process timers still needed for the debounce scheduling.
// The actual buffer data lives in Redis so it survives crashes/restarts.
const activeTimers: Map<string, NodeJS.Timeout> = new Map();

export const BufferingService = {
    async add(
        sessionName: string,
        contactId: string,
        text: string,
        channel: 'whatsapp' | 'simulator',
        inputType: 'text' | 'audio' | 'image' = 'text',
        whatsappChatJid?: string,
        adAttribution?: Record<string, string | undefined>
    ) {
        const key = `${sessionName}:${contactId}`;
        const r = getRedis();

        const bot = await prisma.bot.findUnique({
            where: { sessionName },
            select: { messageBuffer: true },
        });
        const delay = bot?.messageBuffer ?? 1500;

        // Format content for AI
        let content = text;
        if (inputType === 'audio') content = `[ÁUDIO TRANSCRITO]: "${text}"`;
        else if (inputType === 'image') content = `[IMAGEM ENVIADA PELO USUÁRIO (Descrição)]: ${text}`;

        if (delay === 0) {
            console.log(`[Buffering] Buffer disabled for ${contactId}. Processing immediately.`);
            MessageProcessor.process(sessionName, contactId, content, channel, 'sessionName', {
                inputType: inputType as any,
                whatsappChatJid,
            }).catch(err => console.error('[Buffering] Immediate process error:', err));
            return;
        }

        // Push message into Redis list
        await r.rpush(bufferKey(key), content);
        // Set TTL on the list so it auto-cleans if the timer fires but Redis was restarted
        await r.expire(bufferKey(key), Math.ceil((delay + 30_000) / 1000));

        // Store metadata (channel, jid, hadAudio, adAttribution)
        const hadAudio = inputType === 'audio';
        const existingMeta = await r.hgetall(metaKey(key));
        const metaPayload: Record<string, string> = {
            sessionName,
            contactId,
            channel,
            whatsappChatJid: whatsappChatJid || existingMeta.whatsappChatJid || '',
            hadAudio: (existingMeta.hadAudio === '1' || hadAudio) ? '1' : '0',
        };
        // Only store ad attribution once (first-touch)
        if (adAttribution && !existingMeta.adAttribution) {
            metaPayload.adAttribution = JSON.stringify(adAttribution);
        } else if (existingMeta.adAttribution) {
            metaPayload.adAttribution = existingMeta.adAttribution;
        }
        await r.hset(metaKey(key), metaPayload);
        await r.expire(metaKey(key), Math.ceil((delay + 30_000) / 1000));

        // Reset debounce timer
        const existing = activeTimers.get(key);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
            activeTimers.delete(key);
            this.flush(key);
        }, delay);

        activeTimers.set(key, timer);
        console.log(`[Buffering] [${key}] Timer reset (${delay}ms)`);
    },

    async flush(key: string) {
        const r = getRedis();
        // Atomically get-and-delete the list
        const messages = await r.lrange(bufferKey(key), 0, -1);
        await r.del(bufferKey(key));
        const meta = await r.hgetall(metaKey(key));
        await r.del(metaKey(key));

        if (!messages.length || !meta.sessionName) return;

        const combinedText = messages.join('\n');
        const inputType = meta.hadAudio === '1' ? 'audio' : 'text';
        const adAttribution = meta.adAttribution ? JSON.parse(meta.adAttribution) : undefined;

        console.log(`[Buffering] Flushing ${messages.length} message(s) for ${meta.contactId}`);

        MessageProcessor.process(
            meta.sessionName,
            meta.contactId,
            combinedText,
            meta.channel as any,
            'sessionName',
            { inputType: inputType as any, whatsappChatJid: meta.whatsappChatJid || undefined, adAttribution }
        ).catch(err => console.error('[Buffering] Process error:', err));
    },
};
