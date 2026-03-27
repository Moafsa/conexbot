import { Users, PieChart, ShieldCheck, ArrowRight, Zap, Target } from "lucide-react";

export default function CrmDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Users className="text-pink-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        CRM & Funil de Leads
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    O ConextBot não apenas responde perguntas; ele vende. O CRM inteligente classifica cada lead e move o funil automaticamente baseado na intenção detectada pela IA.
                </p>
            </section>

            {/* Stages Grid */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black">
                    <Target className="text-gray-400" /> Movimentação Automática
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 glass rounded-[2rem] border border-white/5 bg-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <h4 className="text-white font-bold mb-2">Novo Contato</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Todo usuário que inicia uma conversa começa aqui. A IA coleta o nome e pré-qualifica o interesse inicial.</p>
                    </div>
                    <div className="p-6 glass rounded-[2rem] border border-white/5 bg-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                        <h4 className="text-white font-bold mb-2">Negociação</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Movido automaticamente quando a IA identifica perguntas sobre preço, planos ou formas de pagamento.</p>
                    </div>
                    <div className="p-6 glass rounded-[2rem] border border-white/5 bg-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <h4 className="text-white font-bold mb-2">Fechado / Ganho</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Estágio final após a confirmação do pagamento via Asaas ou link de checkout gerado no próprio chat.</p>
                    </div>
                </div>
            </section>

            {/* Scoring Section */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-pink-500/5 max-w-3xl">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-6 italic font-black">
                    <PieChart className="text-pink-400" /> Lead Scoring (0-100)
                </h3>
                <p className="text-gray-400 leading-relaxed mb-8 italic">
                    "Pare de perder tempo com curiosos. Foque nos leads que demonstraram real intenção de compra hoje."
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                        <Zap size={20} className="text-yellow-400 shrink-0" />
                        <div>
                            <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Qualificação Live</h5>
                            <p className="text-[10px] text-gray-500">Cálculo de intenção em tempo real por conversa.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                        <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                        <div>
                            <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Priorização</h5>
                            <p className="text-[10px] text-gray-500">Destaque automático no Dashboard Conext.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
