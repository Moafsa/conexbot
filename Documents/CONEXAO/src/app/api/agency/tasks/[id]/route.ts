export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT - Update task status or details
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing gerenciam tarefas.' }, { status: 403 });
        }

        const resolvedParams = await params;
        const taskId = resolvedParams.id;
        const body = await req.json();
        const { title, description, status, dueDate } = body;

        // Verificar se a tarefa pertence a esta agência
        const existingTask = await prisma.clientTask.findFirst({
            where: {
                id: taskId,
                agencyId: agency.id
            }
        });

        if (!existingTask) {
            return NextResponse.json({ error: 'Tarefa não encontrada ou não pertence a esta agência.' }, { status: 404 });
        }

        // Atualizar
        const updatedTask = await prisma.clientTask.update({
            where: { id: taskId },
            data: {
                ...(title !== undefined ? { title } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {})
            }
        });

        return NextResponse.json({ success: true, task: updatedTask });

    } catch (error: any) {
        console.error(`[KanbanTasks] Erro ao editar tarefa:`, error);
        return NextResponse.json({ error: 'Erro interno ao atualizar os dados da tarefa.' }, { status: 500 });
    }
}

// DELETE - Delete task
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing podem excluir tarefas.' }, { status: 403 });
        }

        const resolvedParams = await params;
        const taskId = resolvedParams.id;

        // Verificar se a tarefa pertence a esta agência
        const existingTask = await prisma.clientTask.findFirst({
            where: {
                id: taskId,
                agencyId: agency.id
            }
        });

        if (!existingTask) {
            return NextResponse.json({ error: 'Tarefa não encontrada ou não pertence a esta agência.' }, { status: 404 });
        }

        // Deletar
        await prisma.clientTask.delete({
            where: { id: taskId }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error(`[KanbanTasks] Erro ao excluir tarefa:`, error);
        return NextResponse.json({ error: 'Erro interno ao remover a tarefa do quadro.' }, { status: 500 });
    }
}
