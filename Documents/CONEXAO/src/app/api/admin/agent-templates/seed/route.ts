export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ALL_SQUADS } from '@/lib/agent-squads';

export async function POST() {
    try {
        // 1. Validar autenticação e autorização
        const session = await getServerSession(authOptions);
        const isAdmin = session && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPERADMIN');
        
        if (!session || !isAdmin) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        console.log(`[AgentTemplateSeed] Iniciando seed de agentes...`);
        let seededCount = 0;

        // 2. Iterar em todos os Squads e Agentes para salvar/atualizar
        for (const squad of ALL_SQUADS) {
            for (const agent of squad.agents) {
                // Upsert para garantir idempotência e não duplicar registros
                await prisma.agentTemplate.upsert({
                    where: { id: agent.id },
                    update: {
                        squadId: agent.squadId,
                        squadName: squad.name,
                        name: agent.name,
                        role: agent.role,
                        emoji: agent.emoji,
                        systemPrompt: agent.systemPrompt,
                        tasks: agent.tasks as any, // Cast para Json
                        llmProvider: agent.llmProvider,
                        llmModel: agent.llmModel,
                        isActive: true,
                    },
                    create: {
                        id: agent.id,
                        squadId: agent.squadId,
                        squadName: squad.name,
                        name: agent.name,
                        role: agent.role,
                        emoji: agent.emoji,
                        systemPrompt: agent.systemPrompt,
                        tasks: agent.tasks as any,
                        llmProvider: agent.llmProvider,
                        llmModel: agent.llmModel,
                        isCustom: false,
                        isActive: true,
                    }
                });
                seededCount++;
            }
        }

        console.log(`[AgentTemplateSeed] Seed concluído com sucesso. ${seededCount} agentes processados.`);
        return NextResponse.json({ 
            success: true, 
            message: `Seed concluído com sucesso. ${seededCount} agentes importados ou atualizados no banco.` 
        });

    } catch (error: any) {
        console.error(`[AgentTemplateSeed] Erro crítico durante seed:`, error);
        return NextResponse.json({ 
            error: 'Erro interno ao realizar o seed dos agentes.', 
            details: error.message 
        }, { status: 500 });
    }
}
