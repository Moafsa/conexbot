
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

console.log('[API Media] Route initialized /api/bots/[id]/media');

/**
 * List all media for a bot
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log('[API Media] GET request received');
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

/**
 * Handle new media (File Upload or External URL)
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log('[API Media] POST request received');
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

        return await handleMediaRequest(req, botId);
    } catch (error) {
        console.error('Error in Media POST:', error);
        return NextResponse.json({ error: 'Falha ao processar mídia', details: String(error) }, { status: 500 });
    }
}

/**
 * Delete a media item
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log('[API Media] DELETE request received');
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id: botId } = await params;
        const { searchParams } = new URL(req.url);
        const mediaId = searchParams.get('mediaId');

        if (!mediaId) {
            return NextResponse.json({ error: 'ID da mídia não fornecido' }, { status: 400 });
        }

        const tenantId = (session.user as any).id;

        // Verify bot belongs to tenant
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        const media = await prisma.botMedia.findFirst({
            where: { id: mediaId, botId },
        });

        if (!media) {
            console.log(`[API Media] Media ${mediaId} not found for bot ${botId}`);
            return NextResponse.json({ error: 'Mídia não encontrada' }, { status: 404 });
        }

        // 1. Delete from Storage if it's an internal file
        const s3Endpoint = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
        if (media.url.includes(s3Endpoint) || media.url.includes('localhost:9000')) {
            try {
                const { StorageService } = await import('@/lib/storage');
                // URL format: http://endpoint/bucket/botId/filename
                const key = media.url.split('/').slice(-2).join('/'); // [botId, filename]
                await StorageService.deleteFile(key);
                console.log(`[API Media] Deleted file from storage: ${key}`);
            } catch (storageError) {
                console.warn('[API Media] Storage deletion failed:', storageError);
            }
        }

        // 2. Delete from Database
        await prisma.botMedia.delete({
            where: { id: mediaId },
        });

        // 3. Trigger reindex
        import('@/services/engine/knowledge').then(async ({ KnowledgeService }) => {
            try {
                await KnowledgeService.reindex(botId);
            } catch (reindexError) {
                console.error('[API Media] Reindex failed after deletion:', reindexError);
            }
        }).catch(() => { });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting bot media:', error);
        return NextResponse.json({ error: 'Falha ao excluir mídia' }, { status: 500 });
    }
}

/**
 * Internal logic for processing media
 */
async function handleMediaRequest(req: Request, botId: string) {
    console.log(`[API Media] Handling request for bot ${botId}`);
    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let filename: string;
    let mimetype: string;
    let description: string | null = null;
    let url: string = '';

    try {
        if (contentType.includes('multipart/form-data')) {
            console.log('[API Media] Type: multipart/form-data');
            const formData = await req.formData();
            const file = formData.get('file') as File;
            description = formData.get('description') as string | null;

            if (!file) throw new Error('Nenhum arquivo enviado');

            console.log(`[API Media] File received: ${file.name} (${file.type}, ${file.size} bytes)`);
            buffer = Buffer.from(await file.arrayBuffer());
            filename = file.name;
            mimetype = file.type;

            // Upload to Storage
            console.log('[API Media] Uploading to storage...');
            const { StorageService } = await import('@/lib/storage');
            const storagePath = `${botId}/${Date.now()}-${filename}`;
            url = await StorageService.uploadFile(buffer, storagePath, mimetype);
            console.log(`[API Media] Uploaded to: ${url}`);
        } else {
            console.log('[API Media] Type: JSON/URL');
            const body = await req.json();
            url = body.url;
            description = body.description || null;
            if (!url) throw new Error('URL não fornecida');

            console.log(`[API Media] Downloading from URL: ${url}`);
            const res = await fetch(url);
            if (!res.ok) throw new Error('Falha ao baixar arquivo da URL');
            
            buffer = Buffer.from(await res.arrayBuffer());
            filename = url.split('/').pop() || 'external-file';
            mimetype = res.headers.get('content-type') || 'application/octet-stream';
            console.log(`[API Media] Downloaded: ${filename} (${mimetype}, ${buffer.length} bytes)`);
        }
    } catch (parseError: any) {
        console.error('[API Media] Parse error:', parseError);
        throw parseError;
    }

    // Determine database type tag
    let dbType: 'image' | 'video' | 'audio' | 'pdf' | 'document' = 'document';
    const lowerMime = mimetype.toLowerCase();
    
    if (lowerMime.startsWith('image/')) dbType = 'image';
    else if (lowerMime.startsWith('video/')) dbType = 'video';
    else if (lowerMime.startsWith('audio/')) dbType = 'audio';
    else if (lowerMime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) dbType = 'pdf';

    // 1. Save to Database (Instant Response)
    const media = await prisma.botMedia.create({
        data: {
            botId,
            type: dbType,
            url,
            filename,
            description: description || null,
            processedAt: null // Mark as pending OCR/indexing
        }
    });

    // 2. Run Heavy Processing in Background
    (async () => {
        try {
            console.log(`[API Media] Starting background processing for ${media.id} (${dbType})`);
            
            let extractedText = null;
            
            // OCR only for PDF and Images
            if (dbType === 'pdf') {
                const { extractTextFromPDF } = await import('@/services/ocr/extractor');
                const res = await extractTextFromPDF(buffer);
                if (res.success) extractedText = res.text;
            } else if (dbType === 'image') {
                const { extractTextFromImage } = await import('@/services/ocr/extractor');
                const res = await extractTextFromImage(buffer);
                if (res.success) extractedText = res.text;
            }

            // Update Database with extracted content
            await prisma.botMedia.update({
                where: { id: media.id },
                data: {
                    extractedText,
                    processedAt: new Date()
                }
            });

            // Reindex the bot knowledge base
            const { KnowledgeService } = await import('@/services/engine/knowledge');
            await KnowledgeService.reindex(botId);
            
            console.log(`[API Media] Background processing finished for ${media.id}`);
        } catch (bgError) {
            console.error(`[API Media] Background error for ${media.id}:`, bgError);
        }
    })();

    return NextResponse.json(media);
}
