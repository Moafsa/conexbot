import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'test_dashboard_full@example.com' },
    include: {
      tenants: {
        include: {
          subscriptions: {
            include: {
              plan: true,
              licenseKeys: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('USUÁRIO NÃO ENCONTRADO NO BANCO.');
    return;
  }

  console.log('--- RESULTADO DA PROVA ---');
  console.log('Usuário:', user.email);
  console.log('Tenant ID:', user.tenants[0]?.id);
  
  const sub = user.tenants[0]?.subscriptions[0];
  if (sub) {
    console.log('Assinatura encontrada!');
    console.log('Plano:', sub.plan.name);
    console.log('Status:', sub.status);
    console.log('Tipo:', sub.plan.type);
    console.log('Chave de Licença:', sub.licenseKeys[0]?.key || 'NENHUMA GERADA AINDA');
  } else {
    console.log('ASSINATURA NÃO ENCONTRADA PARA ESTE USUÁRIO.');
  }
}

checkUser()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
