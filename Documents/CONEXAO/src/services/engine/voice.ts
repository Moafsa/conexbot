
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const VoiceService = {
    /**
     * Transcribe audio file using OpenAI Whisper
     */
    async transcribe(audioPath: string): Promise<string> {
        try {
            console.log(`[VoiceService] Transcribing ${audioPath}...`);

            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: 'whisper-1',
                language: 'pt', // Force Portuguese for better accuracy
            });

            console.log(`[VoiceService] Transcription result: "${transcription.text}"`);
            return transcription.text;
        } catch (error) {
            console.error('[VoiceService] Transcription failed:', error);
            // Return empty string or throw depending on strategy. 
            // Returning empty string allows the bot to say "Please send text" gracefully?
            // Actually, throwing is better so we can log it.
            throw error;
        }
    },

    /**
     * Generate Audio (TTS) from text using OpenAI TTS
     * Returns path to saved file
     */
    async speak(text: string): Promise<string> {
        try {
            console.log(`[VoiceService] Generating audio for: "${text.substring(0, 50)}..."`);

            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: "alloy", // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
                input: text,
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());

            // Save to public dir so it can be served/sent
            const fileName = `tts-${uuidv4()}.mp3`;
            const publicDir = path.join(process.cwd(), 'public', 'media', 'temp');

            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            const filePath = path.join(publicDir, fileName);
            fs.writeFileSync(filePath, buffer);

            console.log(`[VoiceService] Audio saved to ${filePath}`);

            // Return relative path or URL - we need absolute path for WuzAPI upload/send usually, 
            // OR a public URL if we send by URL. 
            // WuzAPI usually takes a URL or Base64. Let's return the local path for now, 
            // the caller (UzapiService) might need to handle the conversion to URL.
            return filePath;
        } catch (error) {
            console.error('[VoiceService] TTS failed:', error);
            throw error;
        }
    }
};
