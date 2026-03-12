
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
// crypto is native in modern Node.js
import ffmpeg from 'fluent-ffmpeg';
// Set ffmpeg path robustly
if (process.platform === 'win32') {
    // On Windows, try common paths
    const commonPaths = [
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) {
            ffmpeg.setFfmpegPath(p);
            break;
        }
    }
}
// On Linux/Docker, we rely on 'apk add ffmpeg' providing it in PATH

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const VoiceService = {
    async transcribe(audioPath: string, openaiApiKey?: string, geminiApiKey?: string): Promise<string> {
        try {
            console.log(`[VoiceService] Transcribing ${audioPath}...`);
            
            // 1. Try OpenAI Whisper (if key available)
            const activeOpenaiKey = openaiApiKey || process.env.OPENAI_API_KEY;
            if (activeOpenaiKey) {
                try {
                    const client = new OpenAI({ apiKey: activeOpenaiKey });
                    const transcription = await client.audio.transcriptions.create({
                        file: fs.createReadStream(audioPath),
                        model: 'whisper-1',
                        language: 'pt',
                    });
                    console.log(`[VoiceService] OpenAI Transcription result: "${transcription.text}"`);
                    return transcription.text;
                } catch (err) {
                    console.warn(`[VoiceService] OpenAI transcription failed, attempting fallbacks...`);
                }
            }

            // 2. Try Gemini 1.5 Flash (Multimodal)
            const activeGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;
            if (activeGeminiKey) {
                try {
                    const audioBuffer = fs.readFileSync(audioPath);
                    const base64Audio = audioBuffer.toString('base64');
                    
                    const reqBody = {
                        contents: [{
                            parts: [
                                { inlineData: { mimeType: "audio/ogg", data: base64Audio } }, // Most internal files are converted to ogg
                                { text: "Transcreva o áudio acima exatamente como foi dito, sem comentários adicionais. Se não houver fala ou apenas ruído, retorne vazio." }
                            ]
                        }],
                        generationConfig: { temperature: 0.0 }
                    };

                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeGeminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reqBody)
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                        console.log(`[VoiceService] Gemini Transcription result: "${text.trim()}"`);
                        return text.trim();
                    }
                } catch (err) {
                    console.error('[VoiceService] Gemini transcription failed:', err);
                }
            }

            throw new Error('No API keys configured for transcription or all providers failed.');
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
                console.log(`[VoiceService] ElevenLabs skipped (missing API key or Voice ID). Using OpenAI TTS fallback.`);
                const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : openai;
                const mp3 = await client.audio.speech.create({
                    model: "tts-1",
                    voice: "alloy", // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
                    input: text,
                });

                buffer = Buffer.from(await mp3.arrayBuffer());
            }

            // Save to public dir so it can be served/sent
            const fileName = `tts-${crypto.randomUUID()}.mp3`;
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
