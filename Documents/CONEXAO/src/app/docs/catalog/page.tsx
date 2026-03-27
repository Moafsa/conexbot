import { ShoppingCart, ShoppingBag, CreditCard, Repeat, Zap, Globe, Package, CheckCircle, Database } from "lucide-react";

export default function CatalogDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Database className="text-purple-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Catálogo de Produtos & IA
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg">
                    Transforme seu bot em um vendedor de elite. Gerencie produtos físicos, digitais ou planos de assinatura com sincronização automática e links de pagamento inteligentes.
                </p>
            </section>

            {/* Core Features */}
            <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 glass rounded-2xl border border-white/5 bg-blue-500/5">
                    <Package className="text-blue-400 mb-2" size={20} />
                    <h5 className="text-white font-bold text-xs uppercase tracking-widest">Produto Físico</h5>
                </div>
                <div className="p-5 glass rounded-2xl border border-white/5 bg-purple-500/5">
                    <Repeat className="text-purple-400 mb-2" size={20} />
                    <h5 className="text-white font-bold text-xs uppercase tracking-widest">Assinaturas</h5>
                </div>
                <div className="p-5 glass rounded-2xl border border-white/5 bg-emerald-500/5">
                    <Globe className="text-emerald-400 mb-2" size={20} />
                    <h5 className="text-white font-bold text-xs uppercase tracking-widest">Sincronização WP</h5>
                </div>
                <div className="p-5 glass rounded-2xl border border-white/5 bg-yellow-500/5">
                    <CreditCard className="text-yellow-400 mb-2" size={20} />
                    <h5 className="text-white font-bold text-xs uppercase tracking-widest">Checkout Link</h5>
                </div>
            </section>

            {/* WooCommerce Sync Expansion */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic underline decoration-blue-500 underline-offset-8">
                    1. Sincronização WooCommerce (WordPress)
                </h2>
                <p className="text-sm text-gray-400">
                    Se você utiliza o Plugin Conext para WordPress, a gestão de produtos é automática. O bot lê os dados diretamente do seu estoque.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-3">
                        <CheckCircle className="text-blue-500" size={16} />
                        <h4 className="text-white font-bold text-xs uppercase">RAG de Catálogo</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            A descrição de cada produto é utilizada pela IA para responder dúvidas técnicas dos clientes, agindo como um consultor especialista.
                        </p>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-3">
                        <Zap className="text-yellow-500" size={16} />
                        <h4 className="text-white font-bold text-xs uppercase">Estoque em Tempo Real</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            O robô sabe quando um produto está fora de estoque e evita fechar vendas de itens indisponíveis.
                        </p>
                    </div>
                </div>
            </section>

            {/* Dynamic Checkout Links */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="text-emerald-500" /> 2. Cobrança e Checkout
                </h2>
                <div className="p-8 glass rounded-3xl border border-white/10 bg-emerald-500/5">
                    <h4 className="text-white font-bold text-sm mb-4">Checkout Inteligente via Asaas</h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">
                        Ao identificar a intenção de compra, a IA gera um link de pagamento dinâmico. Se o cliente já for cadastrado no seu Asaas, a cobrança pode ser enviada por PIX direto no chat.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                            <h5 className="text-[10px] text-gray-100 uppercase font-black mb-1 tracking-widest text-emerald-300">Pagamento Único</h5>
                            <p className="text-[10px] text-gray-500">Gera um link de PIX/Cartão que libera o produto imediatamente após a confirmação.</p>
                        </div>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                            <h5 className="text-[10px] text-gray-100 uppercase font-black mb-1 tracking-widest text-purple-300">Planos Recorrentes</h5>
                            <p className="text-[10px] text-gray-500">Cria uma assinatura automática no Asaas que cobrará o cliente todo mês.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categorization and Management */}
            <section className="p-8 glass rounded-3xl border border-white/10 bg-white/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Package className="text-indigo-400" /> Organização de Catálogo
                </h3>
                <p className="text-sm text-gray-400 italic mb-6">
                    Você pode organizar itens em categorias para facilitar a busca da IA.
                </p>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs text-gray-300">Integração com CRM para tracking de conversão por produto.</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs text-gray-300">Dashboard de performance de vendas individuais.</span>
                    </div>
                </div>
            </section>

            {/* Call to action */}
            <section className="text-center p-8 bg-black/20 rounded-3xl border border-white/5">
                <p className="text-xs text-gray-500 italic">
                    "Automatizar o checkout via IA reduz o tempo de fechamento em média 60%."
                </p>
            </section>
        </div>
    );
}
