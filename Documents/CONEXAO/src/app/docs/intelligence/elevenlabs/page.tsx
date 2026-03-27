
import { Mic, Zap, Cpu, Settings, PlayCircle, ShieldCheck, ArrowRight, Brain } from "lucide-react";

export default function ElevenLabsDocsPage() {
    return (
        <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                        <Mic className="text-indigo-400" size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                            Síntese de Voz ElevenLabs
                        </h1>
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-[0.3em] mt-1">Alta Fidelidade & Emoção</p>
                    </div>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Dê uma voz humana e persuasiva ao seu assistente. Com a integração nativa ao **ElevenLabs**, o ConextBot transforma respostas de texto em áudios de altíssima fidelidade em segundos.
                </p>
            </section>

            {/* How it works */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black uppercase tracking-tighter">
                    <Zap className="text-yellow-400" /> Como Funciona no Sistema
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-indigo-500/5 hover:border-indigo-500/20 transition-all group">
                        <Brain className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
                        <h4 className="text-white font-bold mb-2">1. Geração de Texto</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest">O Arquiteto processa a resposta ideal baseada no contexto do lead.</p>
                    </div>
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 hover:border-purple-500/20 transition-all group">
                        <Cpu className="text-purple-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
                        <h4 className="text-white font-bold mb-2">2. Conversão Neural</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest">O sistema envia o texto para ElevenLabs, aplicando tom e emoção configurados.</p>
                    </div>
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 hover:border-emerald-500/20 transition-all group">
                        <PlayCircle className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
                        <h4 className="text-white font-bold mb-2">3. Entrega via Áudio</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest">O WhatsApp recebe o áudio como se tivesse sido gravado na hora.</p>
                    </div>
                </div>
            </section>

            {/* Config Section */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-indigo-500/5 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-8 italic">
                        <Settings className="text-gray-400 group-hover:rotate-90 transition-transform duration-1000" /> Configuração Rápida
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="flex gap-4 p-6 bg-black/40 rounded-3xl border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">1</div>
                            <div>
                                <h5 className="text-white font-bold mb-1">API Key</h5>
                                <p className="text-xs text-gray-500">Obtenha sua chave no dashboard do ElevenLabs e insira no menu **Configurações &gt; Inteligência**.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-black/40 rounded-3xl border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">2</div>
                            <div>
                                <h5 className="text-white font-bold mb-1">Voice ID</h5>
                                <p className="text-xs text-gray-500">Cada bot pode ter um Voice ID único. Escolha entre vozes pré-definidas ou use o **Instant Voice Cloning** para clonar sua própria voz.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 bg-black/40 rounded-3xl border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">3</div>
                            <div>
                                <h5 className="text-white font-bold mb-1">Estabilidade & Similaridade</h5>
                                <p className="text-xs text-gray-500">Ajuste o "slider" de personalidade para definir se a voz deve ser mais monótona/séria ou expressiva/emocional.</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10" />
            </section>

            {/* Why use it */}
            <section className="grid md:grid-cols-2 gap-8">
                <div className="p-8 border border-white/5 rounded-[2rem] bg-black/20">
                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-400" /> Por que usar Voz?
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed italic border-l border-emerald-500/20 pl-4 py-2">
                        "Áudios aumentam a confiança do lead em até 300% em comparação com textos frios. Em nichos de consultoria e vendas complexas, a voz é o que fecha o contrato."
                    </p>
                </div>
                <div className="p-8 border border-white/5 rounded-[2rem] bg-indigo-500/5 flex items-center justify-between group cursor-pointer hover:bg-indigo-500/10 transition-all">
                    <div>
                        <h4 className="text-indigo-400 font-bold mb-1">Dúvidas Técnicas?</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Consulte nossa API ou o Suporte N2</p>
                    </div>
                    <ArrowRight className="text-indigo-400 group-hover:translate-x-2 transition-transform" />
                </div>
            </section>
        </div>
    );
}
