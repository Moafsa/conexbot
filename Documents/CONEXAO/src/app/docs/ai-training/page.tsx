export default function AiTrainingPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    Configuração de Chaves & Primeiro Passo
                </h1>
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8">
                    <h3 className="text-red-500 font-bold mb-2">⚠️ REQUISITO MANDATÓRIO</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Antes de usar o **Arquiteto de IA** ou criar qualquer **Bot**, você **DEVE** configurar sua chave de API (OpenAI ou Gemini). 
                        Sem uma chave ativa em **Configurações &gt; IA**, o sistema não terá "cérebro" para processar comandos ou gerar respostas.
                    </p>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">1. Chaves de IA (OpenAI / Gemini)</h2>
                <p className="text-sm text-gray-400">Acesse **Configurações &gt; IA** para inserir suas credenciais:</p>
                <div className="grid gap-4">
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="font-bold text-indigo-400 mb-1">OpenAI (Padrão)</h4>
                        <p className="text-xs text-gray-400">Padrão para processamento de texto e **Áudio (TTS)**. Se você não usar ElevenLabs, o bot usará o motor da OpenAI para falar.</p>
                    </div>
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="font-bold text-pink-400 mb-1">ElevenLabs (Opcional)</h4>
                        <p className="text-xs text-gray-400">Upgrade de qualidade. Use apenas se desejar vozes ultra-realistas. Caso contrário, o áudio padrão da sua chave de IA será utilizado.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">2. Treinamento RAG</h2>
                <p className="text-gray-400">O robô aprende através de fontes de dados que você fornece:</p>
                <ul className="list-disc list-inside space-y-3 text-sm text-gray-400">
                    <li><strong className="text-white">Website:</strong> Insira o link da sua empresa e o bot aprenderá tudo sobre seus serviços.</li>
                    <li><strong className="text-white">PDFs e Mídia:</strong> Suba manuais ou tabelas de preços no menu de mídias para consultas técnicas precisas.</li>
                </ul>
            </section>
        </div>
    );
}
