import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed v3: Iniciando limpeza e semeadura dos planos do Writer...');

  // Limpa planos antigos
  await prisma.plan.deleteMany({
    where: { type: 'WRITER_PLUGIN' }
  });

  const plans = [
    {
      id: 'writer-basic',
      name: 'Basic',
      description: 'Ideal para blogs pequenos e iniciantes no Marketing de Conteúdo.',
      price: 79.0,
      priceQuarterly: 213.0,
      priceSemiannual: 399.0,
      priceYearly: 758.0,
      postLimit: 15,
      wordLimit: 30000,
      type: 'WRITER_PLUGIN',
      features: [
        { text: '15 Posts com IA por mês', enabled: true },
        { text: 'Otimização Yoast SEO', enabled: true },
        { text: 'Imagens Geradas por IA', enabled: true },
        { text: 'Humanização Anti-IA', enabled: true },
        { text: 'Suporte por Email', enabled: true }
      ]
    },
    {
      id: 'writer-pro',
      name: 'Pro',
      description: 'Para criadores profissionais e sites de autoridade que precisam de volume.',
      price: 149.0,
      priceQuarterly: 402.0,
      priceSemiannual: 760.0,
      priceYearly: 1430.0,
      postLimit: 40,
      wordLimit: 100000,
      type: 'WRITER_PLUGIN',
      features: [
        { text: '40 Posts com IA por mês', enabled: true },
        { text: 'Otimização Yoast SEO', enabled: true },
        { text: 'Imagens Geradas por IA (DALL-E 3)', enabled: true },
        { text: 'Humanização Anti-IA Avançada', enabled: true },
        { text: 'Suporte Prioritário', enabled: true }
      ]
    },
    {
      id: 'writer-elite',
      name: 'Elite',
      description: 'Poder total para redes de sites, agências e portais de notícias.',
      price: 297.0,
      priceQuarterly: 802.0,
      priceSemiannual: 1515.0,
      priceYearly: 2851.0,
      postLimit: 120,
      wordLimit: 300000,
      type: 'WRITER_PLUGIN',
      features: [
        { text: '120 Posts com IA por mês', enabled: true },
        { text: 'Otimização Yoast SEO Pro', enabled: true },
        { text: 'Imagens Ilimitadas', enabled: true },
        { text: 'Clusterização de Conteúdo', enabled: true },
        { text: 'Suporte VIP via WhatsApp', enabled: true }
      ]
    }
  ];

  for (const planData of plans) {
    await prisma.plan.create({
      data: {
        ...planData,
        features: planData.features as any,
        type: 'WRITER_PLUGIN' as any
      }
    });
  }

  console.log('Seed v3 finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
