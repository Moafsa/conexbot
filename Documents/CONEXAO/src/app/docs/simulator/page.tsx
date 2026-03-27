import { PlayCircle, ShieldCheck, Zap, Database, ArrowRight, MessageSquare, Terminal } from "lucide-react";

export default function SimulatorDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <PlayCircle className="text-emerald-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Simulador de Vendas
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Teste seu assistente em um ambiente seguro antes de ir ao ar no WhatsApp. O Simulador emula 100% o comportamento do bot, incluindo raciocínio RAG e lógica de fechamento.
                </p>
            </section>

            {/* Why use grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-6 glass rounded-[2.5rem] border border-white/5 bg-indigo-500/5">
                    <MessageSquare size={24} className="text-indigo-400 mb-4" />
                    <h3 className="text-white font-bold mb-2">Chat Nativo Web</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Interface idêntica ao WhatsApp para você testar **áudios**, **imagens** e **links de pagamento** sem custos de mensagens.</p>
                </div>
                <div className="p-6 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5">
                    <Terminal size={24} className="text-emerald-400 mb-4" />
                    <h3 className="text-white font-bold mb-2">Depuração de Chunks</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Veja exatamente qual parte do seu treinamento PDF ou site a IA consultou para gerar aquela resposta específica.</p>
                </div>
            </section>

            {/* How to test */}
            <section className="p-8 glass rounded-[2.5rem] border border-white/10 bg-white/5 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 italic font-black">
                    <Zap className="text-yellow-400" /> Fluxo de Teste Sugerido
                </h3>
                <div className="space-y-4 text-sm text-gray-400">
                    <div className="flex gap-4">
                        <span className="font-bold text-indigo-400">01.</span>
                        <p>Inicie o chat no dashboard e peça uma proposta comercial complexa.</p>
                    </div>
                    <div className="flex items-center gap-2 border-l-2 border-white/5 ml-[0.35rem] pl-4 py-1">
                        <ArrowRight size={14} className="text-gray-600" />
                        <p className="text-xs text-gray-500 italic">Verifique se o tom de voz está consistente com sua marca.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="font-bold text-indigo-400">02.</span>
                        <p>Simule uma pergunta técnica que exige consulta aos arquivos de treino.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="font-bold text-indigo-400">03.</span>
                        <p>Teste o fechamento pedindo um link de pagamento ou PIX.</p>
                    </div>
                </div>
            </section>

            {/* Final tip */}
            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/40 shadow-xl">
                <ShieldCheck size={28} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    "Ajuste o `System Prompt` e a temperatura da IA no módulo **Arquiteto** e veja os efeitos instantaneamente no simulador antes do deploy oficial."
                </p>
            </section>
        </div>
    );
}
