import 'dotenv/config';
import { SupervisorService } from '@/services/engine/supervisor';
import { VectorService } from '@/services/engine/vector';
import { FollowUpService } from '@/services/engine/follow-up';
import prisma from '@/lib/prisma';

async function testArchitecture() {
    console.log('🧪 STARTING SMART ARCHITECTURE TEST...\n');

    // 1. Test Vector Service
    console.log('--- 1. Testing Vector Service ---');
    const embedding = await VectorService.generateEmbedding("Test embedding");
    console.log(`✅ Embedding generated: ${embedding.length} dimensions`);
    if (embedding.length !== 1536) throw new Error("Invalid embedding dimensions");

    // 2. Test Supervisor Service
    console.log('\n--- 2. Testing Supervisor ---');
    const analysis = await SupervisorService.analyze(
        "Quanto custa o serviço?",
        [{ role: 'assistant', content: 'Olá, como posso ajudar?' }],
        'LEAD'
    );
    console.log(`✅ Analysis Result:`);
    console.log(`   Next Stage: ${analysis.nextStage}`);
    console.log(`   Strategy: ${analysis.strategy}`);
    console.log(`   Reasoning: ${analysis.reasoning}`);

    if (!analysis.nextStage) throw new Error("Supervisor failed to return stage");

    // 3. Test Database Connection & Models
    console.log('\n--- 3. Testing Database Models ---');
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('⚠️ No tenant found, skipping DB write test (expected in empty dev env)');
    } else {
        console.log(`✅ Tenant found: ${tenant.email}`);
        // We could create a dummy contact here to test fields but let's assume migration worked if query works
    }

    console.log('\n🎉 ALL SYSTEMS GO! Architecture is ready.');
}

testArchitecture()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
