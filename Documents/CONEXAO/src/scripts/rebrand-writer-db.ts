import { prisma } from '../lib/prisma';

async function main() {
    console.log('🔄 Iniciando atualização de branding no banco de dados (Apenas Plugin Writer)...');

    try {
        const plans = await prisma.plan.findMany({
            where: {
                type: 'WRITER_PLUGIN'
            }
        });

        console.log(`Encontrados ${plans.length} planos de plugin.`);

        for (const plan of plans) {
            const newName = plan.name
                .replace(/Conex AI Writer/g, 'Conext Writer')
                .replace(/Conex Writer/g, 'Conext Writer');

            const newDescription = plan.description?.replace(/Conex/g, 'Conext') || plan.description;

            if (newName !== plan.name || newDescription !== plan.description) {
                await prisma.plan.update({
                    where: { id: plan.id },
                    data: {
                        name: newName,
                        description: newDescription
                    }
                });
                console.log(`✅ Plano atualizado: "${plan.name}" -> "${newName}"`);
            } else {
                console.log(`ℹ️ Plano "${plan.name}" já está atualizado.`);
            }
        }

        console.log('✅ Rebranding do banco de dados concluído!');
    } catch (error) {
        console.error('❌ Erro durante o rebranding do banco:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Erro fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        // O proxy do prisma não expõe $disconnect diretamente, mas o singleton sim se acessado
        // Para scripts curtos, o processo encerrando é suficiente.
    });
