import { prisma } from '../lib/prisma';

async function main() {
    console.log('🌱 Semeando planos do Conext Writer...');

    const plans = [
        {
            name: 'Basic',
            description: 'Ideal para blogs pequenos e iniciantes no Marketing de Conteúdo.',
            price: 79,
            priceYearly: 758, // ~20% desc
            botLimit: 1,
            messageLimit: 0, 
            postLimit: 15,
            wordLimit: 30000,
            type: 'WRITER_PLUGIN',
            features: JSON.stringify([
                { text: '15 Posts com IA por mês', enabled: true },
                { text: 'Otimização Yoast SEO', enabled: true },
                { text: 'Imagens Geradas por IA', enabled: true },
                { text: 'Humanização Anti-IA', enabled: true },
                { text: 'Suporte por Email', enabled: true }
            ])
        },
        {
            name: 'Pro',
            description: 'Para criadores profissionais e sites de autoridade que precisam de volume.',
            price: 149,
            priceYearly: 1430,
            botLimit: 1,
            messageLimit: 0,
            postLimit: 40,
            wordLimit: 100000,
            type: 'WRITER_PLUGIN',
            features: JSON.stringify([
                { text: '40 Posts com IA por mês', enabled: true },
                { text: 'Otimização Yoast SEO', enabled: true },
                { text: 'Imagens Geradas por IA (DALL-E 3)', enabled: true },
                { text: 'Humanização Anti-IA Avançada', enabled: true },
                { text: 'Suporte Prioritário', enabled: true }
            ])
        },
        {
            name: 'Elite',
            description: 'Poder total para redes de sites, agências e portais de notícias.',
            price: 297,
            priceYearly: 2851,
            botLimit: 1,
            messageLimit: 0,
            postLimit: 120,
            wordLimit: 300000,
            type: 'WRITER_PLUGIN',
            features: JSON.stringify([
                { text: '120 Posts com IA por mês', enabled: true },
                { text: 'Otimização Yoast SEO Pro', enabled: true },
                { text: 'Imagens Ilimitadas', enabled: true },
                { text: 'Clusterização de Conteúdo', enabled: true },
                { text: 'Suporte VIP via WhatsApp', enabled: true }
            ])
        }
    ];

    for (const planData of plans) {
        // Upsert para evitar duplicatas se rodar de novo
        const plan = await prisma.plan.upsert({
            where: { id: `writer-${planData.name.toLowerCase()}` },
            update: planData as any,
            create: {
                id: `writer-${planData.name.toLowerCase()}`,
                ...planData
            } as any
        });
        console.log(`✅ Plano ${plan.name} (${plan.type}) criado/atualizado.`);
    }

    console.log('✨ Seed concluído com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    });
