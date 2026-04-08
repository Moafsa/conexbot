
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

// Lazy init to avoid build errors if env is missing
let defaultOpenai: OpenAI | null = null;
function getOpenAI() {
    if (!defaultOpenai) {
        defaultOpenai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'no-key-at-build-time',
        });
    }
    return defaultOpenai;
}

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
            // Normalize text for natural speech (currencies, URLs, measurements)
            const normalizedText = this.normalizeForSpeech(text);
            
            console.log(`[VoiceService] Generating audio for: "${normalizedText.substring(0, 50)}..."`);
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
                        text: normalizedText,
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
                const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : getOpenAI();
                const mp3 = await client.audio.speech.create({
                    model: "tts-1",
                    voice: "alloy", // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
                    input: normalizedText,
                });

                buffer = Buffer.from(await mp3.arrayBuffer());
            }

            // Save to /tmp (Docker-safe; public/media/temp can have EACCES)
            const fileName = `tts-${crypto.randomUUID()}.mp3`;
            const tempDir = '/tmp';

            const filePath = path.join(tempDir, fileName);
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
    },

    /**
     * Normalizes text for more natural speech.
     * Converts currencies, URLs and measurements to natural language.
     */
    normalizeForSpeech(text: string): string {
        if (!text) return "";
        let result = text;

        // 1. Normalize URLs (google.com.br -> google ponto com ponto b r)
        result = result.replace(/(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-z]{2,3}(?:\.[a-z]{2})?)(?:\/[^\s]*)?/gi, (match, protocol, www, domain) => {
            return domain.replace(/\./g, ' ponto ').split('').join(' '); // split join helps reading chars if needed, but ponto is enough
        });
        // Simplify: just domain with "ponto"
        result = result.replace(/([a-zA-Z0-9-]{2,})\.([a-z]{2,3}(?:\.[a-z]{2,3})?)/gi, '$1 ponto $2');

        // 2. Normalize Currencies (R$ 388,00 -> trezentos e oitenta e oito reais)
        result = result.replace(/R\$\s?(\d+(?:\.\d+)?)(?:,(\d{2}))?/g, (match, integer, cents) => {
            const num = parseInt(integer.replace(/\./g, ''));
            const centsNum = cents ? parseInt(cents) : 0;
            
            let parts = [];
            if (num > 0) {
                parts.push(this.numberToWordsPT(num));
                parts.push(num === 1 ? 'real' : 'reais');
            }
            if (centsNum > 0) {
                if (parts.length > 0) parts.push('e');
                parts.push(this.numberToWordsPT(centsNum));
                parts.push(centsNum === 1 ? 'centavo' : 'centavos');
            }
            return parts.join(' ');
        });

        // 3. Normalize Measurements (2,5cm x 3m -> dois vírgula cinco centímetros por três metros)
        const unitMap: any = {
            'cm': 'centímetros',
            'm': 'metros',
            'mm': 'milímetros',
            'km': 'quilômetros',
            'kg': 'quilos',
            'g': 'gramas',
            'l': 'litros',
            'ml': 'mililitros',
            'x': 'por',
        };

        result = result.replace(/(\d+(?:,\d+)?)\s*(cm|mm|km|kg|ml|m|g|l|(?:\sx\s)|x)/gi, (match, val, unit) => {
            const normalizedVal = val.replace(',', ' vírgula ');
            // If comma was used, split and convert parts
            let spokenVal = normalizedVal;
            if (normalizedVal.includes(' vírgula ')) {
                const [int, dec] = normalizedVal.split(' vírgula ');
                spokenVal = `${this.numberToWordsPT(parseInt(int))} vírgula ${this.numberToWordsPT(parseInt(dec))}`;
            } else {
                spokenVal = this.numberToWordsPT(parseInt(val));
            }

            const cleanUnit = unit.trim().toLowerCase();
            const spokenUnit = unitMap[cleanUnit] || cleanUnit;
            return `${spokenVal} ${spokenUnit}`;
        });

        return result;
    },

    numberToWordsPT(num: number): string {
        if (num === 0) return "zero";
        const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
        const tens = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
        const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
        const hundreds = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
        const hundredsSpecial = "cento";

        if (num < 10) return units[num];
        if (num >= 10 && num < 20) return teens[num - 10];
        if (num >= 20 && num < 100) {
            const t = Math.floor(num / 10);
            const u = num % 10;
            return u === 0 ? tens[t] : `${tens[t]} e ${units[u]}`;
        }
        if (num >= 100 && num < 1000) {
            if (num === 100) return "cem";
            const h = Math.floor(num / 100);
            const rem = num % 100;
            const hStr = h === 1 ? hundredsSpecial : hundreds[h];
            return rem === 0 ? hStr : `${hStr} e ${this.numberToWordsPT(rem)}`;
        }
        if (num >= 1000 && num < 1000000) {
            const k = Math.floor(num / 1000);
            const rem = num % 1000;
            const kStr = k === 1 ? "mil" : `${this.numberToWordsPT(k)} mil`;
            return rem === 0 ? kStr : `${kStr} e ${this.numberToWordsPT(rem)}`;
        }
        
        return num.toString(); // Fallback for very large numbers
    }
};
