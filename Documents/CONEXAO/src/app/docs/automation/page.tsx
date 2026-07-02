import { Zap, Clock, MessageSquare, ShieldCheck, PlayCircle, BarChart3, Bot, Repeat, ArrowRight } from "lucide-react";

export default function FollowUpDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Zap className="text-yellow-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Follow-up & Réguas de Vendas
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Não perca leads por falta de resposta. Nosso sistema de **Follow-up Inteligente** monitora o engajamento e retoma conversas automaticamente com mensagens personalizadas pela própria IA.
                </p>
            </section>

            {/* Core Mechanics Grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-yellow-500/5 group hover:border-yellow-500/20 transition-all">
                    <Clock className="text-yellow-400 mb-6" size={28} />
                    <h3 className="text-white font-bold mb-3 uppercase tracking-widest text-[10px]">Recuperação de 24h</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Se um cliente parar de responder após uma proposta ou tirar uma dúvida, o bot envia uma mensagem de "lembrete" após 24 horas, mantendo o funil aquecido sem ser invasivo.
                    </p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/20 transition-all">
                    <Repeat className="text-blue-400 mb-6" size={28} />
                    <h3 className="text-white font-bold mb-3 uppercase tracking-widest text-[10px]">Réguas de Relacionamento</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Configure gatilhos automáticos para **Pós-Venda**, **Lembretes de Eventos** ou **Renovação de Assinatura**. Ideal para manter o LTV (Lifetime Value) alto.
                    </p>
                </div>
            </section>

            {/* How it works (Supervisor Filter) */}
            <section className="space-y-8 max-w-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-emerald-500 underline-offset-8">
                    <ShieldCheck className="text-emerald-500" /> O Filtro do Supervisor
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-emerald-500/20 pl-6 py-2">
                    "Diferente de disparadores estáticos que fazem spam, cada follow-up do ConextBot passa por uma análise de contexto antes de ser disparado."
                </p>
                
                <div className="bg-black/40 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
                    <h4 className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] mb-4">O Supervisor verifica automaticamente:</h4>
                    <ul className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                        <li className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            Se o cliente já respondeu ou comprou.
                        </li>
                        <li className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            Se o tom da conversa permite o lembrete.
                        </li>
                        <li className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            Se a venda já foi concluída no Asaas/Woo.
                        </li>
                        <li className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            Se o cliente solicitou não ser incomodado.
                        </li>
                    </ul>
                </div>
            </section>

            {/* Examples of Scripts */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white italic font-black">Estudos de Caso (Gatilhos)</h2>
                
                <div className="space-y-6">
                    <div className="p-8 border border-white/5 rounded-[2rem] bg-indigo-500/5 group hover:bg-indigo-500/10 transition-all flex flex-col md:flex-row gap-6 items-start">
                        <div className="p-4 rounded-[1.5rem] bg-indigo-500/10 text-indigo-400 shrink-0">
                            <PlayCircle size={28} />
                        </div>
                        <div>
                            <h5 className="text-white font-black text-sm uppercase tracking-widest mb-3">Carrinho Abandonado (Plugin WP)</h5>
                            <p className="text-sm text-gray-500 italic max-w-xl">"Oi João! Vi que você se interessou pela Raquete Ultra, mas não fechou o pedido. Ficou com alguma dúvida sobre o frete? Consigo um cupom de 5% se fechar agora!"</p>
                        </div>
                    </div>

                    <div className="p-8 border border-white/5 rounded-[2rem] bg-purple-500/5 group hover:bg-purple-500/10 transition-all flex flex-col md:flex-row gap-6 items-start">
                        <div className="p-4 rounded-[1.5rem] bg-purple-500/10 text-purple-400 shrink-0">
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <h5 className="text-white font-black text-sm uppercase tracking-widest mb-3">Pós-Venda & NPS (Relacionamento)</h5>
                            <p className="text-sm text-gray-500 italic max-w-xl">"Olá! Faz uma semana que seu pedido chegou. Está gostando da experiência? Se precisar de ajuda com a configuração técnica, me avise por aqui!"</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Setup Info */}
            <section className="p-8 glass rounded-[2.5rem] border border-white/10 bg-black/40 shadow-xl flex items-center gap-6 max-w-2xl">
                <div className="p-4 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
                    <Bot size={24} />
                </div>
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    Ative o follow-up no menu <strong className="not-italic">Editar Bot &gt; Automações</strong>. Use as variáveis dinâmicas e deixe a IA cuidar da persuasão final.
                </p>
            </section>
        </div>
    );
}
