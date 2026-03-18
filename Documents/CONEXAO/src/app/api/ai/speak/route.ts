
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VoiceService } from '@/services/engine/voice';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { text, botId } = body;

        if (!text) {
            return NextResponse.json({ error: 'Missing text' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const tenant = await prisma.tenant.findUnique({
            where: { id: userId },
            select: { openaiApiKey: true, elevenLabsApiKey: true, geminiApiKey: true }
        });

        const bot = botId ? await prisma.bot.findUnique({
            where: { id: botId, tenantId: userId },
            select: { voiceId: true }
        }) : null;

        const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        
        const openaiApiKey = tenant?.openaiApiKey || globalConfig?.openaiApiKey;
        const elevenLabsApiKey = tenant?.elevenLabsApiKey || globalConfig?.elevenLabsApiKey;
        const geminiApiKey = tenant?.geminiApiKey || globalConfig?.geminiApiKey;

        // Use VoiceService to generate audio
        const audioPath = await VoiceService.speak(
            text,
            openaiApiKey,
            elevenLabsApiKey,
            bot?.voiceId
        );

        // Read the file and return as audio/ogg
        const audioBuffer = fs.readFileSync(audioPath);
        
        // Return base64 to be played on client
        const base64Audio = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;
        
        return NextResponse.json({ audio: base64Audio });

    } catch (error: any) {
        console.error('[Speak API] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate audio' }, { status: 500 });
    }
}
