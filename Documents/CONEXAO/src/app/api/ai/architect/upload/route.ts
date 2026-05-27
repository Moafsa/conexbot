export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { extractTextByMime, detectMimeFromExtension } from '@/services/ocr/extractor';

const MAX_FILE_SIZE_MB = 25;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const botId = formData.get('botId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // Size guard
        const sizeMb = file.size / 1024 / 1024;
        if (sizeMb > MAX_FILE_SIZE_MB) {
            return NextResponse.json(
                { error: `Arquivo muito grande (${sizeMb.toFixed(1)} MB). Limite: ${MAX_FILE_SIZE_MB} MB` },
                { status: 413 }
            );
        }

        // Resolve MIME — browser sometimes sends 'application/octet-stream' for unknown types
        let mimeType = file.type || '';
        if (!mimeType || mimeType === 'application/octet-stream') {
            mimeType = detectMimeFromExtension(file.name);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await extractTextByMime(buffer, mimeType);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Falha na extração de texto' },
                { status: 422 }
            );
        }

        let mediaId: string | null = null;

        // Persist to BotMedia if botId was provided
        if (botId && result.text) {
            const { StorageService } = await import('@/lib/storage');
            const prisma = (await import('@/lib/prisma')).default;

            const filename = `${botId}/${Date.now()}-${file.name}`;
            const url = await StorageService.uploadFile(buffer, filename, mimeType);

            const mediaType = mimeType.startsWith('image/') ? 'image'
                            : mimeType === 'application/pdf'  ? 'pdf'
                            : mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv' ? 'spreadsheet'
                            : mimeType.includes('wordprocessing') || mimeType.includes('msword') ? 'document'
                            : 'text';

            const media = await prisma.botMedia.create({
                data: {
                    botId,
                    type: mediaType,
                    url,
                    filename: file.name,
                    extractedText: result.text,
                    processedAt: new Date(),
                },
            });
            mediaId = media.id;
        }

        return NextResponse.json({
            success: true,
            extractedText: result.text,
            fileName: file.name,
            mimeType,
            charCount: result.text.length,
            mediaId,
        });

    } catch (error: any) {
        console.error('[Upload] Error:', error);
        return NextResponse.json({ error: 'Erro no processamento do arquivo', detail: error.message }, { status: 500 });
    }
}
