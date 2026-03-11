import { BufferingService } from '../services/engine/buffering';
import { MessageProcessor } from '../services/engine/processor';
import prisma from '../lib/prisma';

// Mock MessageProcessor.process to avoid actual AI calls
const originalProcess = MessageProcessor.process;
(MessageProcessor as any).process = async (identifier: string, senderPhone: string, messageText: string) => {
    console.log(`\n✅ [FINAL RESULT] MessageProcessor.process called with combined content:\n---\n${messageText}\n---\n`);
    return { text: "mock response" };
};

async function runTest() {
    console.log("\n🚀 Iniciando teste de buffering...\n");
    
    const bot = await prisma.bot.findFirst({
        where: { sessionName: { not: null } }
    });

    if (!bot || !bot.sessionName) {
        console.error("❌ Nenhum bot com sessionName encontrado no banco para rodar o teste.");
        process.exit(1);
    }

    const sessionName = bot.sessionName;
    const phone = "5511999999999";
    const currentBuffer = bot.messageBuffer;

    console.log(`🤖 Usando bot: ${bot.name}`);
    console.log(`⏱️ Buffer atual configurado: ${currentBuffer}ms`);

    console.log("\n1️⃣ Enviando: 'Olá' (texto)");
    await BufferingService.add(sessionName, phone, "Olá", "whatsapp", "text");
    
    await new Promise(r => setTimeout(r, 500));
    console.log("\n2️⃣ Enviando: 'Tudo bem?' (texto) após 500ms");
    await BufferingService.add(sessionName, phone, "Tudo bem?", "whatsapp", "text");

    await new Promise(r => setTimeout(r, 500));
    console.log("\n3️⃣ Enviando: 'Gato fofo' (imagem/descrição) após 500ms");
    await BufferingService.add(sessionName, phone, "Gato fofo", "whatsapp", "image");

    console.log(`\n⏳ Aguardando ${currentBuffer + 500}ms para o flush...\n`);
    await new Promise(r => setTimeout(r, currentBuffer + 500));

    console.log("🏁 Teste concluído.");
    process.exit(0);
}

runTest().catch(err => {
    console.error("❌ Erro no teste:", err);
    process.exit(1);
});
