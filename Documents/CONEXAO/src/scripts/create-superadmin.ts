/**
 * Cria o primeiro SUPERADMIN (ou promove um usuário existente).
 * Uso no servidor (dentro do container ou com DATABASE_URL):
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/create-superadmin.ts <email> <senha>
 * Ou só promover por email:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/create-superadmin.ts <email>
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email) {
    console.error('Uso: create-superadmin.ts <email> [senha]');
    console.error('  Se passar senha, cria ou atualiza o usuário e define como SUPERADMIN.');
    console.error('  Se omitir senha, apenas promove o usuário existente a SUPERADMIN.');
    process.exit(1);
  }

  try {
    const existing = await prisma.tenant.findUnique({ where: { email } });

    if (existing) {
      const data: { role: 'SUPERADMIN'; password?: string } = { role: 'SUPERADMIN' };
      if (password) {
        data.password = await bcrypt.hash(password, 12);
      }
      await prisma.tenant.update({
        where: { email },
        data,
      });
      console.log(`✅ Usuário ${email} atualizado para SUPERADMIN.`);
    } else {
      if (!password) {
        console.error('❌ Usuário não existe. Informe email e senha para criar: create-superadmin.ts <email> <senha>');
        process.exit(1);
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.tenant.create({
        data: {
          email,
          name: email.split('@')[0],
          password: hashedPassword,
          role: 'SUPERADMIN',
        },
      });
      console.log(`✅ SUPERADMIN criado: ${email}`);
    }
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
