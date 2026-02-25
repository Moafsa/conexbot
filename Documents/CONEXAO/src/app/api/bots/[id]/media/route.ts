
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const tenantId = (session.user as any).id;

        // Verify bot belongs to tenant
        const bot = await prisma.bot.findFirst({
            where: { id, tenantId },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        const media = await prisma.botMedia.findMany({
            where: { botId: id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(media);
    } catch (error) {
        console.error('Error fetching bot media:', error);
        return NextResponse.json({ error: 'Falha ao buscar mídias' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id: botId } = await params;
        const tenantId = (session.user as any).id;

        // Verify bot belongs to tenant
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const description = formData.get('description') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Storage
        const { StorageService } = await import('@/lib/storage');
        const filename = `${botId}/${Date.now()}-${file.name}`;
        const url = await StorageService.uploadFile(buffer, filename, file.type);

        // 2. OCR (Reuse existing services)
        const { extractTextFromPDF, extractTextFromImage } = await import('@/services/ocr/extractor');
        let extractedText = null;

        if (file.type === 'application/pdf') {
            const res = await extractTextFromPDF(buffer);
            if (res.success) extractedText = res.text;
        } else if (file.type.startsWith('image/')) {
            const res = await extractTextFromImage(buffer);
            if (res.success) extractedText = res.text;
        }

        // 3. Database
        const media = await prisma.botMedia.create({
            data: {
                botId,
                type: file.type.startsWith('image/') ? 'image' : 'pdf',
                url,
                filename: file.name,
                description: description || null,
                extractedText,
                processedAt: new Date()
            }
        });

        // 4. Trigger Reindex
        const { KnowledgeService } = await import('@/services/engine/knowledge');
        await KnowledgeService.reindex(botId);

        return NextResponse.json(media);
    } catch (error) {
        console.error('Error saving bot media:', error);
        return NextResponse.json({ error: 'Falha ao salvar mídia', details: String(error) }, { status: 500 });
    }
}
