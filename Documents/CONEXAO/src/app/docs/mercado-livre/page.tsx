import { ShoppingBag, RefreshCw, MessageSquareCode, Link2, CheckCircle, Tag } from "lucide-react";

export default function MercadoLivreDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <ShoppingBag className="text-yellow-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Mercado Livre
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Sincronize preço e estoque entre sua loja WooCommerce e seus anúncios no Mercado Livre, e deixe a IA consultar ou atualizar preços de anúncios direto pela conversa.
                </p>
            </section>

            {/* Requirement */}
            <section className="p-6 glass rounded-[2rem] border border-white/10 bg-white/5 max-w-3xl flex items-start gap-4">
                <Link2 className="text-yellow-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Esta integração é um complemento do <strong className="text-white not-italic">Plugin WordPress/WooCommerce</strong>. É necessário ter a loja já sincronizada com o Conext Bot antes de conectar o Mercado Livre.
                </p>
            </section>

            {/* Steps */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black underline decoration-yellow-500 underline-offset-8 decoration-4">
                    <RefreshCw className="text-gray-400" /> Como Conectar
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-yellow-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold mb-4 shadow-xl">1</div>
                        <h4 className="text-white font-bold mb-2">Abra pelo plugin</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">No painel do plugin WordPress, clique em &quot;Conectar Mercado Livre&quot;. Você será direcionado para o site do Conext Bot para autenticação.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-yellow-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold mb-4 shadow-xl">2</div>
                        <h4 className="text-white font-bold mb-2">Autorize no Mercado Livre</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Faça login na sua conta de vendedor e autorize o acesso. Os tokens ficam salvos e são renovados automaticamente.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-yellow-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold mb-4 shadow-xl">3</div>
                        <h4 className="text-white font-bold mb-2">Mapeie os produtos</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Vincule cada produto do WooCommerce ao anúncio correspondente no Mercado Livre para ativar a sincronização.</p>
                    </div>
                </div>
            </section>

            {/* Features grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-yellow-500/5 group hover:border-yellow-500/20 transition-all">
                    <Tag className="text-yellow-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Sincronização de preço e estoque</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Ao alterar um preço no WooCommerce (ou vice-versa), o anúncio correspondente no Mercado Livre é atualizado automaticamente via webhook.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-indigo-500/5 group hover:border-indigo-500/20 transition-all">
                    <MessageSquareCode className="text-indigo-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Consulta e ajuste via IA</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Peça ao seu bot, em linguagem natural, para consultar um anúncio ou atualizar um preço — a IA usa suas ferramentas internas de Mercado Livre para executar a ação.</p>
                </div>
            </section>

            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/20 max-w-2xl">
                <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    Ideal para lojas que vendem simultaneamente no site próprio e no Mercado Livre e querem evitar vender um produto sem estoque em um dos dois canais.
                </p>
            </section>
        </div>
    );
}
