
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path robustly
let ffmpegPath = ffmpegStatic;
if (ffmpegPath && ffmpegPath.startsWith('\\ROOT')) {
    ffmpegPath = ffmpegPath.replace('\\ROOT', 'C:\\Users\\User');
}

// Fallback manual check for Docker/Linux or Windows
if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    const ext = process.platform === 'win32' ? '.exe' : '';
    const manualPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', `ffmpeg${ext}`);
    if (fs.existsSync(manualPath)) {
        ffmpegPath = manualPath;
    }
}

if (ffmpegPath) {
    console.log(`[VoiceService] Setting FFmpeg path to: ${ffmpegPath}`);
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const VoiceService = {
    /**
     * Transcribe audio file using OpenAI Whisper
     */
    async transcribe(audioPath: string, openaiApiKey?: string): Promise<string> {
        try {
            console.log(`[VoiceService] Transcribing ${audioPath}...`);
            const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : openai;

            const transcription = await client.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: 'whisper-1',
                language: 'pt', // Force Portuguese for better accuracy
            });

            console.log(`[VoiceService] Transcription result: "${transcription.text}"`);
            return transcription.text;
        } catch (error) {
            console.error('[VoiceService] Transcription failed:', error);
            throw error;
        }
    },

    /**
     * Generate Audio (TTS) from text using OpenAI TTS or ElevenLabs
     * Returns path to saved file
     */
    async speak(text: string, openaiApiKey?: string, elevenLabsApiKey?: string, voiceId?: string): Promise<string> {
        try {
            console.log(`[VoiceService] Generating audio for: "${text.substring(0, 50)}..."`);
            let buffer: Buffer;

            if (elevenLabsApiKey && voiceId && voiceId.trim() !== "") {
                console.log(`[VoiceService] Using ElevenLabs provider with Voice ID: ${voiceId}`);
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': elevenLabsApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('[VoiceService] ElevenLabs API Error:', errText);
                    throw new Error(`ElevenLabs API returned ${response.status}: ${errText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
            } else {
                console.log(`[VoiceService] Using OpenAI TTS fallback`);
                const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : openai;
                const mp3 = await client.audio.speech.create({
                    model: "tts-1",
                    voice: "alloy", // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
                    input: text,
                });

                buffer = Buffer.from(await mp3.arrayBuffer());
            }

            // Save to public dir so it can be served/sent
            const fileName = `tts-${uuidv4()}.mp3`;
            const publicDir = path.join(process.cwd(), 'public', 'media', 'temp');

            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            const filePath = path.join(publicDir, fileName);
            fs.writeFileSync(filePath, buffer);

            console.log(`[VoiceService] MP3 saved to ${filePath}. Converting to OGG/Opus...`);
            const opusPath = await this.convertToOpus(filePath);

            return opusPath;
        } catch (error) {
            console.error('[VoiceService] TTS failed:', error);
            throw error;
        }
    },

    /**
     * Converts any audio file to OGG/Opus format for WhatsApp compatibility
     */
    async convertToOpus(inputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const outputPath = inputPath.replace(/\.[^.]+$/, '.ogg');
            console.log(`[VoiceService] Converting ${inputPath} to ${outputPath}...`);

            ffmpeg(inputPath)
                .toFormat('ogg')
                .audioCodec('libopus')
                .on('end', () => {
                    console.log(`[VoiceService] Conversion finished: ${outputPath}`);
                    // Optionally delete the original MP3 to save space
                    try { fs.unlinkSync(inputPath); } catch (e) { }
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('[VoiceService] Conversion error:', err);
                    reject(err);
                })
                .save(outputPath);
        });
    }
};
