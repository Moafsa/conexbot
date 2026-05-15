import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL || "postgresql://admin:password123@localhost:5434/conext_db?schema=public";
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Identificar produtos e seus planos
    const products = await prisma.productCatalog.findMany({
        include: { plans: true }
    });

    // Mapeamento de nomes para consolidar
    const mapping = {
        "Marketing IA": "MARKETING_IA",
        "CRM Pipeline": "CRM_PIPELINE",
        "Conext Writer": "CONEXT_WRITER",
        "Conext Bot": "CONEXT_BOT"
    };

    for (const prod of products) {
        const canonicalName = (mapping as any)[prod.name] || prod.name;
        
        // Se o nome não é o canônico (ex: "Conext Writer"), vamos tentar mover os planos e atualizar
        if (prod.name !== canonicalName) {
            const canonicalProd = products.find(p => p.name === canonicalName);
            
            if (canonicalProd) {
                console.log(`Consolidando ${prod.name} em ${canonicalName}...`);
                // Move planos se existirem
                if (prod.plans.length > 0) {
                    await (prisma as any).plan.updateMany({
                        where: { productCatalogId: prod.id },
                        data: { productCatalogId: canonicalProd.id }
                    });
                }
                // Deleta o duplicado
                await prisma.productCatalog.delete({ where: { id: prod.id } });
            } else {
                // Apenas renomeia se o canônico não existir
                console.log(`Renomeando ${prod.name} para ${canonicalName}...`);
                await prisma.productCatalog.update({
                    where: { id: prod.id },
                    data: { name: canonicalName }
                });
            }
        }
    }
    
    // Deleta os vazios se houver duplicata de nome exato (caso raro agora)
    console.log("Limpeza concluída.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
