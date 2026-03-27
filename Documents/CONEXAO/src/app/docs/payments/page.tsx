import { CreditCard, DollarSign, Repeat, ShieldCheck, Zap, ArrowRight, Wallet, Settings } from "lucide-react";

export default function PaymentsDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="text-emerald-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Pagamentos & Checkout Asaas
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Transforme o WhatsApp em um checkout de alta performance. Com a integração nativa ao **Asaas**, seu bot gera links de pagamento, PIX e assinaturas em segundos.
                </p>
            </section>

            {/* Payment Types Grid */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black">
                    <DollarSign className="text-gray-400" /> Modalidades de Venda
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/20 transition-all">
                        <Zap className="text-emerald-400 mb-4" size={24} />
                        <h4 className="text-white font-bold mb-2">Venda Única (PIX/Cartão)</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Geração de link dinâmico para produtos físicos ou serviços pontuais. O bot envia o link e o código PIX Copia e Cola diretamente no chat.</p>
                    </div>
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 group hover:border-purple-500/20 transition-all">
                        <Repeat className="text-purple-400 mb-4" size={24} />
                        <h4 className="text-white font-bold mb-2">Assinaturas Recorrentes</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Criação automática de planos (Mensal, Trimestral, Anual) no Asaas. Ideal para SaaS, clubes de assinatura e consultorias.</p>
                    </div>
                </div>
            </section>

            {/* Split Section */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-indigo-500/5">
                <div className="max-w-3xl">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-6 italic underline decoration-indigo-500 underline-offset-8">
                        <Wallet className="text-indigo-400" /> Split de Pagamento & Marketplace
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-8">
                        O ConextBot não apenas automatiza conversas, mas cria um ecossistema financeiro completo. Com o **Split do Asaas**, você pode escalar sua operação ou criar um modelo de agência lucrativo.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                            <h5 className="text-white font-bold mb-2 flex items-center gap-2 italic">
                                <Zap size={16} className="text-yellow-400" /> Fluxo Automático
                            </h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Cada venda realizada pelo bot é processada e dividida instantaneamente. O percentual configurado vai direto para a wallet parceira.
                            </p>
                        </div>
                        <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                            <h5 className="text-white font-bold mb-2 flex items-center gap-2 italic">
                                <Settings size={16} className="text-blue-400" /> Configuração por Bot
                            </h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Você pode definir percentuais de split diferentes para cada robô, permitindo parcerias personalizadas com cada cliente.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 border border-indigo-500/20 rounded-3xl bg-indigo-500/5">
                        <h4 className="text-indigo-400 font-black mb-4 uppercase tracking-tighter italic text-xl">🚀 Modelo de Negócios para Parceiros</h4>
                        <p className="text-sm text-gray-400 mb-6 font-light">
                            Transforme o ConextBot em sua própria agência de IA. Você pode monetizar de três formas simultâneas:
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="p-1 bg-indigo-500/20 rounded-lg"><ArrowRight size={12} className="text-indigo-400" /></div>
                                <p className="text-xs text-gray-300"><strong>Setup & Criação:</strong> Cobre pela configuração inicial e personalização do bot para o cliente.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="p-1 bg-indigo-500/20 rounded-lg"><ArrowRight size={12} className="text-indigo-400" /></div>
                                <p className="text-xs text-gray-300"><strong>Mensalidade (SaaS):</strong> Cancele ou ative o acesso do bot conforme o pagamento recorrente do seu cliente.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="p-1 bg-indigo-500/20 rounded-lg"><ArrowRight size={12} className="text-indigo-400" /></div>
                                <p className="text-xs text-gray-300"><strong>Split de Vendas:</strong> Receba um percentual automático de cada transação que o bot fechar via WhatsApp.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Final tip */}
            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/20 max-w-2xl">
                <ShieldCheck size={28} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    "Aumente sua conversão em até 40% enviando o QR Code PIX diretamente no WhatsApp do cliente."
                </p>
            </section>
        </div>
    );
}
