import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { extractTextFromPDF, extractTextFromImage } from '@/services/ocr/extractor';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const botId = formData.get('botId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let result;

        if (file.type === 'application/pdf') {
            result = await extractTextFromPDF(buffer);
        } else if (file.type.startsWith('image/')) {
            result = await extractTextFromImage(buffer);
        } else {
            return NextResponse.json({ error: 'Tipo de arquivo não suportado' }, { status: 400 });
        }

        if (result.success) {
            let mediaId = null;

            // If botId is provided, we persist the file and the extracted text
            if (botId) {
                const { StorageService } = await import('@/lib/storage');
                const prisma = (await import('@/lib/prisma')).default;

                const filename = `${botId}/${Date.now()}-${file.name}`;
                const url = await StorageService.uploadFile(buffer, filename, file.type);

                const media = await prisma.botMedia.create({
                    data: {
                        botId,
                        type: file.type.startsWith('image/') ? 'image' : 'pdf',
                        url,
                        filename: file.name,
                        extractedText: result.text,
                        processedAt: new Date()
                    }
                });
                mediaId = media.id;
            }

            return NextResponse.json({
                success: true,
                extractedText: result.text,
                fileName: file.name,
                mediaId
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Erro no processamento do arquivo' }, { status: 500 });
    }
}
