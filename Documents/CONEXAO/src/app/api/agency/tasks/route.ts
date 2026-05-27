export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List tasks
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        // Obter agência do usuário logado
        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing gerenciam tarefas Kanban.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId');

        // Buscar tarefas
        const tasks = await prisma.clientTask.findMany({
            where: {
                agencyId: agency.id,
                ...(clientId ? { clientId } : {})
            },
            include: {
                client: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(tasks);

    } catch (error: any) {
        console.error(`[KanbanTasks] Erro ao listar tarefas:`, error);
        return NextResponse.json({ error: 'Erro interno ao carregar o quadro de tarefas.' }, { status: 500 });
    }
}

// POST - Create task
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        // Obter agência do usuário logado
        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing gerenciam tarefas.' }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, squadId = 'generico', agentId = 'generico', clientId, status = 'PENDING', dueDate } = body;

        if (!title || !clientId) {
            return NextResponse.json({ error: 'Os campos title e clientId são obrigatórios.' }, { status: 400 });
        }

        // Garantir que o cliente pertence a esta agência
        const client = await prisma.tenant.findFirst({
            where: {
                id: clientId,
                agencyId: agency.id
            }
        });

        if (!client) {
            return NextResponse.json({ error: 'Cliente não encontrado ou não pertence a sua agência.' }, { status: 404 });
        }

        // Criar a tarefa no banco
        const task = await prisma.clientTask.create({
            data: {
                title,
                description: description || null,
                squadId,
                agentId,
                clientId: client.id,
                agencyId: agency.id,
                status,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        return NextResponse.json({ success: true, task });

    } catch (error: any) {
        console.error(`[KanbanTasks] Erro ao criar tarefa:`, error);
        return NextResponse.json({ error: 'Erro interno ao registrar tarefa no quadro.' }, { status: 500 });
    }
}
