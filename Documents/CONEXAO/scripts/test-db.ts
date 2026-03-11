import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const stages = await prisma.crmStage.findMany();
        console.log("Success:", stages);
    } catch (e: any) {
        if (e.message) {
            console.error("Prisma error message:", e.message);
        } else {
            console.error("Unknown error:", e);
        }
    } finally {
        await prisma.$disconnect();
    }
}

check();
