
import { NextResponse } from 'next/server';
import { MessageProcessor } from '@/services/engine/processor';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { botId, message, sessionId } = body;

        if (!botId || !message) {
            return NextResponse.json({ error: 'Missing botId or message' }, { status: 400 });
        }

        // Use a fixed "simulator" phone number or the sessionId provided
        const simulatorPhone = sessionId || 'SIMULATOR_USER';

        // Process message
        // Channel = 'simulator'
        // SearchBy = 'id' (since we have botId, not sessionName necessarily)
        const response = await MessageProcessor.process(
            botId,
            simulatorPhone,
            message,
            'simulator',
            'id',
            { inputType: 'text' }
        );

        return NextResponse.json({
            response: response?.text || 'Sem resposta do processador',
            media: response?.media || []
        });

    } catch (error: any) {
        console.error('Simulator API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
