import { Cpu, Eye, BarChart3, Binary, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function IntelligenceDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Cpu className="text-cyan-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Supervisor & Insights IA
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    O cérebro estratégico que opera nos bastidores. O **SupervisorService** analisa conversas para extrair inteligência, classificar sentimento e tomar decisões autonomas de delegação.
                </p>
            </section>

            {/* Role Grid */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black">
                    <Binary className="text-gray-400" /> Análise Silenciosa (Background)
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-cyan-500/5 group hover:border-cyan-500/20 transition-all">
                        <h4 className="text-cyan-400 font-bold mb-3 uppercase tracking-widest text-[10px]">Classificação de Intenção</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Detecta se o cliente quer comprar, reclamar ou apenas tirar uma dúvida técnica, movendo os estágios do CRM sem intervenção humana.</p>
                    </div>
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 group hover:border-purple-500/20 transition-all">
                        <h4 className="text-purple-400 font-bold mb-3 uppercase tracking-widest text-[10px]">Delegação Inteligente</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Se necessário, o Supervisor troca o agente atual por um especialista (ex: troca bot de FAQ por bot de Venda ou Suporte N2).</p>
                    </div>
                </div>
            </section>

            {/* Insights Display Example */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-white/5 space-y-6 max-w-3xl">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3 italic">
                        <Eye className="text-emerald-400" /> Insights Gerenciais
                    </h3>
                    <div className="px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                        Live Tracking
                    </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-emerald-500/20 pl-6 py-2">
                    "Cliente demonstrou alto interesse no plano anual, mas demonstrou preocupação com suporte em finais de semana. Recomendo focar em SLA."
                </p>
                
                <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                    <h5 className="text-[10px] font-black text-cyan-300 uppercase tracking-widest mb-4">Raciocínio Técnico (JSON):</h5>
                    <pre className="text-[10px] text-gray-600 leading-relaxed overflow-x-auto font-mono scrollbar-thin scrollbar-thumb-white/5">
{`{
  "nextStage": "NEGOCIAÇÃO",
  "assignedBotId": "bot_sales_pro_v4",
  "sentiment": "POSITIVE",
  "insight": "Lead qualificado; foco em suporte e SLA."
}`}
                    </pre>
                </div>
            </section>

            {/* ElevenLabs Integration Card */}
            <section className="grid md:grid-cols-1 gap-8 max-w-2xl">
                <Link href="/docs/intelligence/elevenlabs" className="group p-8 glass rounded-[2.5rem] border border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Mic className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-lg italic">Configurar Voz ElevenLabs</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Sincronia neural para áudios humanos</p>
                        </div>
                    </div>
                    <ArrowRight className="text-indigo-400 group-hover:translate-x-2 transition-transform" />
                </Link>

                <div className="flex items-center gap-6 p-8 glass rounded-[2rem] border border-white/5 bg-black/40 shadow-xl">
                    <ShieldCheck size={32} className="text-indigo-400 shrink-0" />
                    <p className="text-[11px] text-gray-500 leading-relaxed italic">
                        "Todos os insights são processados via GPT-4o-mini em janelas de contexto otimizadas, garantindo baixo latência e alta precisão analítica para o seu negócio."
                    </p>
                </div>
            </section>
        </div>
    );
}

import Link from "next/link";
import { Mic } from "lucide-react";
