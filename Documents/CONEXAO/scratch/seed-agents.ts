import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '..', '.env') });

import prisma from '../src/lib/prisma';
import { ALL_SQUADS } from '../src/lib/agent-squads';

async function main() {
    console.log('Seeding agent templates...');
    let count = 0;
    for (const squad of ALL_SQUADS) {
        for (const agent of squad.agents) {
            await prisma.agentTemplate.upsert({
                where: { id: agent.id },
                update: {
                    squadId: agent.squadId,
                    squadName: squad.name,
                    name: agent.name,
                    role: agent.role,
                    emoji: agent.emoji,
                    systemPrompt: agent.systemPrompt,
                    tasks: agent.tasks as any,
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
            count++;
        }
    }
    console.log(`Successfully seeded ${count} agent templates!`);
}

main().catch(err => {
    console.error('Error seeding agents:', err);
    process.exit(1);
});
