import { Zap, Clock, MessageSquare, ShieldCheck, PlayCircle, BarChart3, Bot, Repeat } from "lucide-react";

export default function FollowUpDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Zap className="text-yellow-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                        Follow-up & Réguas de Vendas
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg">
                    Não perca leads por falta de resposta. Nosso sistema de **Follow-up Inteligente** monitora o engajamento e retoma conversas automaticamente com mensagens personalizadas via IA.
                </p>
            </section>

            {/* Core Mechanics */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-6 glass rounded-3xl border border-white/5 bg-yellow-500/5">
                    <Clock className="text-yellow-400 mb-4" size={24} />
                    <h3 className="text-white font-bold mb-2">Recuperação de 24h</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Se um cliente parar de responder após uma proposta ou dúvida, o robô envia uma mensagem de "lembrete" após 24 horas, mantendo o funil aquecido.
                    </p>
                </div>
                <div className="p-6 glass rounded-3xl border border-white/5 bg-blue-500/5">
                    <Repeater className="text-blue-400 mb-4" size={24} />
                    <h3 className="text-white font-bold mb-2">Réguas de Relacionamento</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Configure mensagens automáticas para **Pós-Venda**, **Lembretes de Eventos** ou **Renovação de Assinatura**.
                    </p>
                </div>
            </section>

            {/* How it works */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ShieldCheck className="text-emerald-500" /> O Filtro do Supervisor
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Diferente de disparadores comuns que fazem spam, cada follow-up passa por uma análise de IA antes de ser enviado.
                </p>
                
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest">O robô verifica:</h4>
                    <ul className="grid sm:grid-cols-2 gap-4">
                        <li className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Se o cliente já respondeu em outro canal.
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Se o tom da conversa permite um lembrete.
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Se a venda já foi concluída.
                        </li>
                        <li className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Se o cliente pediu para não ser incomodado.
                        </li>
                    </ul>
                </div>
            </section>

            {/* Examples */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white">Exemplos de Automação</h2>
                
                <div className="space-y-4">
                    <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex gap-4 items-start">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <PlayCircle size={20} />
                        </div>
                        <div>
                            <h5 className="text-white font-bold text-sm mb-1">Trigger: Carrinho Abandonado</h5>
                            <p className="text-xs text-gray-500 italic">"Oi [Nome]! Vi que você se interessou pelo [Produto], mas não finalizou. Ficou com alguma dúvida sobre o frete ou pagamento?"</p>
                        </div>
                    </div>

                    <div className="p-6 border border-white/5 rounded-2xl bg-white/5 flex gap-4 items-start">
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                            <Repeat size={20} />
                        </div>
                        <div>
                            <h5 className="text-white font-bold text-sm mb-1">Trigger: Pós-Venda (7 dias)</h5>
                            <p className="text-xs text-gray-500 italic">"Olá! Faz uma semana que você recebeu seu pedido. Está gostando da experiência? Se precisar de ajuda com a configuração, é só falar!"</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Setup */}
            <section className="p-8 glass rounded-3xl border border-white/10 bg-indigo-500/5">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Bot className="text-indigo-400" /> Como configurar?
                </h3>
                <ol className="space-y-4 text-sm text-gray-400">
                    <li>1. Vá em **Meus Bots {" > "} Selecionar Bot {" > "} Editar**.</li>
                    <li>2. Role até a seção **Follow-up & Automação**.</li>
                    <li>3. Ative a chave **Follow-up de 24h** ou crie uma **Nova Regra Personalizada**.</li>
                    <li>4. Descreva o objetivo da regra (ex: "Oferecer cupom se não comprou em 3 dias").</li>
                </ol>
            </section>
        </div>
    );
}

function Repeater(props: any) {
    return <Repeat {...props} />;
}
