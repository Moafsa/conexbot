import { ShoppingCart, ShoppingBag, CreditCard, Repeat, Zap, Globe, Package, CheckCircle, Database, ArrowRight } from "lucide-react";

export default function CatalogDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Database className="text-purple-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Catálogo de Produtos & Woo
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Transforme seu bot em um vendedor de elite. Gerencie produtos físicos, digitais ou planos de assinatura com sincronização automática e links de pagamento inteligentes via Asaas.
                </p>
            </section>

            {/* Core Features Grid */}
            <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="p-6 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/30 transition-all">
                    <Package className="text-blue-400 mb-4" size={24} />
                    <h5 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Físico</h5>
                </div>
                <div className="p-6 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 group hover:border-purple-500/30 transition-all">
                    <Repeat className="text-purple-400 mb-4" size={24} />
                    <h5 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Assinatura</h5>
                </div>
                <div className="p-6 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/30 transition-all">
                    <Globe className="text-emerald-400 mb-4" size={24} />
                    <h5 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Sincrol WP</h5>
                </div>
                <div className="p-6 glass rounded-[2.5rem] border border-white/5 bg-yellow-500/5 group hover:border-yellow-500/30 transition-all">
                    <CreditCard className="text-yellow-400 mb-4" size={24} />
                    <h5 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Checkout</h5>
                </div>
            </section>

            {/* WooCommerce Sync Expansion Section */}
            <section className="space-y-10 max-w-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-blue-500 underline-offset-8">
                    1. Sincronização WooCommerce
                </h2>
                <div className="p-8 glass rounded-[2rem] border border-white/10 bg-white/5 space-y-6 shadow-2xl">
                    <p className="text-sm text-gray-400 leading-relaxed italic">
                        "Se você utiliza o Plugin Conext para WordPress, a gestão de produtos é 100% automática. O bot sincroniza estoque e preços em tempo real."
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-6 mt-8">
                        <div className="p-6 bg-black/40 border border-white/5 rounded-3xl group">
                            <CheckCircle className="text-blue-500 mb-4" size={18} />
                            <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-2">RAG de Catálogo</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed italic border-l-2 border-white/5 pl-4">A descrição de cada produto é utilizada pela IA para responder dúvidas técnicas e consultoria técnica.</p>
                        </div>
                        <div className="p-6 bg-black/40 border border-white/5 rounded-3xl group">
                            <Zap className="text-yellow-500 mb-4" size={18} />
                            <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-2">Estoque em Tempo Real</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed italic border-l-2 border-white/5 pl-4">O robô sabe se um produto está indisponível e evita fechar vendas erradas, notificando o administrador.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Checkout Section */}
            <section className="space-y-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-emerald-500 underline-offset-8">
                    2. Cobrança e Checkout
                </h2>
                <div className="p-10 glass rounded-[3rem] border border-white/10 bg-emerald-500/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <h4 className="text-white font-black text-sm mb-6 flex items-center gap-2">
                        Checkout Inteligente via Asaas <ArrowRight size={16} className="text-emerald-400 animate-pulse" />
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-10 max-w-xl">
                        Ao identificar a intenção de compra, a IA gera um link de pagamento dinâmico. Se o cliente já for cadastrado no seu Asaas, a cobrança pode ser enviada por PIX direto no chat.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                        <div className="p-6 bg-black/60 rounded-[1.5rem] border border-white/5 hover:border-emerald-500/20 transition-all">
                            <h5 className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-3">Pagamento Único</h5>
                            <p className="text-[10px] text-gray-500 italic">Gera um link de PIX ou Cartão que libera o produto imediatamente após a confirmação automática do webhook.</p>
                        </div>
                        <div className="p-6 bg-black/60 rounded-[1.5rem] border border-white/5 hover:border-purple-500/20 transition-all">
                            <h5 className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] mb-3">Assinaturas Recorrentes</h5>
                            <p className="text-[10px] text-gray-500 italic">Cria um plano automático no Asaas que cobrará o cliente periodicamente, notificando o robô em cada renovação.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Organize & Strategy Info */}
            <section className="p-8 glass rounded-[2.5rem] border border-white/10 bg-white/5 max-w-2xl shadow-xl flex items-center gap-6">
                <div className="p-4 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
                    <ShoppingBag size={24} />
                </div>
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    "Organize seus produtos por categorias no Dashboard para que a IA consiga recomendar combos e pacotes sugeridos no momento da venda."
                </p>
            </section>
        </div>
    );
}
