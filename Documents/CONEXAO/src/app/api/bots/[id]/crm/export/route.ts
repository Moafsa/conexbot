import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const stageId = searchParams.get('stageId');

        const contacts = await prisma.contact.findMany({
            where: {
                botId: id,
                stageId: stageId || undefined
            },
            include: {
                stage: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const data = contacts.map(c => ({
            Nome: c.name || 'N/A',
            Telefone: c.phone,
            Email: c.email || 'N/A',
            Estágio: c.stage?.name || c.funnelStage,
            Score: c.leadScore,
            Sentimento: c.sentiment || 'N/A',
            Insight: c.lastAiInsight || 'N/A',
            CriadoEm: c.createdAt.toISOString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatos');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="contatos_${id}.xlsx"`
            }
        });
    } catch (error) {
        console.error('[Export] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
