import { MessageProcessor } from './processor';
import prisma from '@/lib/prisma';

interface BufferedChat {
    messages: string[];
    timer: NodeJS.Timeout | null;
    sessionName: string;
    contactId: string; // phone
    channel: 'whatsapp' | 'simulator';
    messageId?: string;
    remoteJid?: string;
}

// In-memory storage for active buffers
// Key: `${sessionName}:${contactId}`
const activeBuffers: Map<string, BufferedChat> = new Map();

export const BufferingService = {
    /**
     * Add a message to the buffer.
     * If a timer exists, clear it and restart (debounce).
     */
    async add(sessionName: string, contactId: string, text: string, channel: 'whatsapp' | 'simulator', inputType: 'text' | 'audio' | 'image' = 'text', options: { messageId?: string, remoteJid?: string } = {}) {
        const key = `${sessionName}:${contactId}`;

        // Get bot configuration for buffer delay
        const bot = await prisma.bot.findUnique({
            where: { sessionName },
            select: { messageBuffer: true }
        });

        const delay = bot?.messageBuffer ?? 1500;

        console.log(`[Buffering] [${key}] Added message. Active buffers before: ${activeBuffers.size}. Delay: ${delay}`);

        if (delay === 0) {
            // Process immediately if buffer is disabled
            console.log(`[Buffering] Buffer disabled (delay=0) for ${contactId}. Processing immediately.`);
            
            let formattedText = text;
            if (inputType === 'audio') {
                formattedText = `[ÁUDIO TRANSCRITO]: "${text}"`;
            } else if (inputType === 'image') {
                formattedText = `[IMAGEM ENVIADA PELO USUÁRIO (Descrição)]: ${text}`;
            }

            MessageProcessor.process(sessionName, contactId, formattedText, channel, 'sessionName', { 
                inputType: inputType as any 
            }).catch(err => console.error('[Buffering] Immediate process error:', err));
            return;
        }

        let buffer = activeBuffers.get(key);

        if (!buffer) {
            buffer = {
                messages: [],
                timer: null,
                sessionName,
                contactId,
                channel,
                messageId: options.messageId,
                remoteJid: options.remoteJid
            };
            activeBuffers.set(key, buffer);
        } else {
            // Update last message ID to mark the whole thread as read
            if (options.messageId) buffer.messageId = options.messageId;
            if (options.remoteJid) buffer.remoteJid = options.remoteJid;
        }

        // Add message part
        // For audio and image, we prefix the content to make it clear to the IA
        let content = text;
        if (inputType === 'audio') {
            content = `[ÁUDIO TRANSCRITO]: "${text}"`;
        } else if (inputType === 'image') {
            content = `[IMAGEM ENVIADA PELO USUÁRIO (Descrição)]: ${text}`;
        }

        buffer.messages.push(content);

        // Clear existing timer
        if (buffer.timer) {
            clearTimeout(buffer.timer);
        }

        // Set new timer
        buffer.timer = setTimeout(() => {
            console.log(`[Buffering] [${key}] 🔥 Timer triggered. Flushing...`);
            this.flush(key);
        }, delay);

        console.log(`[Buffering] [${key}] Timer set for ${delay}ms. Messages so far: ${buffer.messages.length}`);
    },

    /**
     * Flush the buffer and process the combined message.
     */
    flush(key: string) {
        const buffer = activeBuffers.get(key);
        if (!buffer) return;

        // Clear entry immediately to avoid race conditions
        activeBuffers.delete(key);

        if (buffer.messages.length === 0) return;

        // Combine messages
        const combinedText = buffer.messages.join('\n');

        console.log(`[Buffering] Flushing ${buffer.messages.length} messages for ${buffer.contactId}: "${combinedText.substring(0, 50)}..."`);

        // Process combined text as a single message
        MessageProcessor.process(
            buffer.sessionName,
            buffer.contactId,
            combinedText,
            buffer.channel,
            'sessionName',
            { inputType: 'text', messageId: buffer.messageId, remoteJid: buffer.remoteJid }
        ).catch(err => console.error('[Buffering] Process error:', err));
    }
};
