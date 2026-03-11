import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const tenant = await prisma.tenant.findUnique({
            where: { id: userId },
            select: { openaiApiKey: true }
        });

        const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        
        const openrouterApiKey = tenant?.openrouterApiKey || globalConfig?.openrouterApiKey;
        const openaiApiKey = tenant?.openaiApiKey || globalConfig?.openaiApiKey;
        const geminiApiKey = tenant?.geminiApiKey || globalConfig?.geminiApiKey;

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Try OpenAI Whisper (if available)
        if (openaiApiKey) {
            try {
                const openai = new OpenAI({ apiKey: openaiApiKey });
                const transcription = await openai.audio.transcriptions.create({
                    file: await OpenAI.toFile(buffer, 'audio.webm'),
                    model: 'whisper-1',
                });
                return NextResponse.json({ text: transcription.text, provider: 'openai' });
            } catch (err) {
                console.error('[Transcribe] OpenAI failed, trying fallbacks...', err);
            }
        }

        // 2. Try Gemini 1.5 Flash (Multimodal Transcription)
        if (geminiApiKey) {
            try {
                const base64Audio = buffer.toString('base64');
                const reqBody = {
                    contents: [{
                        parts: [
                            { inlineData: { mimeType: "audio/webm", data: base64Audio } },
                            { text: "Transcreva o áudio acima exatamente como foi dito, sem comentários adicionais. Se não houver fala ou apenas ruído, retorne vazio." }
                        ]
                    }],
                    generationConfig: { temperature: 0.0 }
                };

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqBody)
                });

                if (res.ok) {
                    const data = await res.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    return NextResponse.json({ text: text.trim(), provider: 'gemini' });
                }
            } catch (err) {
                console.error('[Transcribe] Gemini failed:', err);
            }
        }

        return NextResponse.json({ error: 'Nenhuma chave de API configurada para transcrição (OpenAI ou Gemini).' }, { status: 400 });
    } catch (error: any) {
        console.error('[Transcribe API] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to transcribe audio' }, { status: 500 });
    }
}
