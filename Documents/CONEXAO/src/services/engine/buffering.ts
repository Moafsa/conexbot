
import { MessageProcessor } from './processor';

interface BufferedChat {
    messages: string[];
    timer: NodeJS.Timeout | null;
    sessionName: string;
    contactId: string; // phone
    channel: 'whatsapp' | 'simulator';
    inputType: 'text' | 'audio';
}

// In-memory storage for active buffers
// Key: `${sessionName}:${contactId}`
const activeBuffers: Map<string, BufferedChat> = new Map();

const BUFFER_DELAY_MS = 3000; // Wait 3 seconds for more messages

export const BufferingService = {
    /**
     * Add a message to the buffer.
     * If a timer exists, clear it and restart (debounce).
     */
    add(sessionName: string, contactId: string, text: string, channel: 'whatsapp' | 'simulator', inputType: 'text' | 'audio' = 'text') {
        const key = `${sessionName}:${contactId}`;

        // Audio messages should probably skip buffering or be handled carefully.
        // If we buffer audio, we can't concatenate files easily without processing.
        // Recommendation: Auto-process audio immediately, OR treat audio as a "trigger" to flush text?
        // For now, let's PROCESS AUDIO IMMEDIATELY and only buffer TEXT.
        if (inputType === 'audio') {
            // If there's pending text, maybe flush it first? 
            // Or just process audio parallel. 
            // Let's flush existing text buffer if any.
            if (activeBuffers.has(key)) {
                this.flush(key);
            }
            // Process audio directly
            MessageProcessor.process(sessionName, contactId, text, channel, 'sessionName', { inputType: 'audio' })
                .catch(err => console.error('[Buffering] Audio process error:', err));
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
                inputType
            };
            activeBuffers.set(key, buffer);
        }

        // Add message part
        buffer.messages.push(text);

        // Clear existing timer
        if (buffer.timer) {
            clearTimeout(buffer.timer);
        }

        // Set new timer
        buffer.timer = setTimeout(() => {
            this.flush(key);
        }, BUFFER_DELAY_MS);

        console.log(`[Buffering] Added "${text}" to buffer for ${contactId}. Waiting ${BUFFER_DELAY_MS}ms...`);
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
        // If multiple lines, join with newline or space. Newline is safer for semantic meaning.
        const combinedText = buffer.messages.join('\n');

        console.log(`[Buffering] Flushing ${buffer.messages.length} messages for ${buffer.contactId}: "${combinedText.substring(0, 50)}..."`);

        // Process
        MessageProcessor.process(
            buffer.sessionName,
            buffer.contactId,
            combinedText,
            buffer.channel,
            'sessionName',
            { inputType: 'text' }
        ).catch(err => console.error('[Buffering] Process error:', err));
    }
};
