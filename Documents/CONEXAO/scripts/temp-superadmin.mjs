import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@conext.click';
    const password = 'admin';

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Upsert tenant
    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) {
        await prisma.tenant.update({
            where: { email },
            data: { role: 'SUPERADMIN', password: hashedPassword }
        });
        console.log('Superadmin atualizado:', email);
    } else {
        await prisma.tenant.create({
            data: {
                email,
                name: 'Superadmin',
                password: hashedPassword,
                role: 'SUPERADMIN'
            }
        });
        console.log('Superadmin criado:', email);
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
