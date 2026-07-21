import { Truck, MapPin, Send, Smartphone, Navigation, CheckCircle, ShieldCheck } from "lucide-react";

export default function DriversDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Truck className="text-orange-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Entregadores &amp; Logística
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Para negócios que entregam (gás, comida, farmácia, e-commerce local), o Conext Bot despacha pedidos para entregadores reais e acompanha a entrega em um mapa ao vivo — sem precisar de nenhum outro sistema.
                </p>
            </section>

            {/* How it works */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black underline decoration-orange-500 underline-offset-8 decoration-4">
                    <Navigation className="text-gray-400" /> Como funciona
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-orange-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold mb-4 shadow-xl">1</div>
                        <h4 className="text-white font-bold mb-2">Cadastre entregadores</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Em Entregadores, adicione nome e telefone de cada motoboy/entregador. Eles não precisam de login no dashboard.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-orange-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold mb-4 shadow-xl">2</div>
                        <h4 className="text-white font-bold mb-2">Pedido chega, IA despacha</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Quando o bot fecha uma venda com endereço de entrega, você despacha manualmente pelo mapa ou define regras de palavras-chave para despacho automático.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-orange-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold mb-4 shadow-xl">3</div>
                        <h4 className="text-white font-bold mb-2">Entregador recebe o link</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">O entregador recebe uma mensagem de WhatsApp com o endereço, link do Google Maps e um link de rastreio pessoal — sem precisar instalar nenhum app.</p>
                    </div>
                </div>
            </section>

            {/* Features grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-orange-500/5 group hover:border-orange-500/20 transition-all">
                    <MapPin className="text-orange-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Mapa ao vivo</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Acompanhe a localização de cada entregador em tempo real no dashboard enquanto o pedido está em rota.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/20 transition-all">
                    <Smartphone className="text-blue-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">App de entregador via WhatsApp</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">O link enviado ao entregador abre uma mini página (PWA) no navegador do celular dele, que envia a localização automaticamente enquanto estiver aberta.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/20 transition-all">
                    <Send className="text-emerald-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Taxas de entrega configuráveis</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Defina taxa fixa ou regras por distância/zona. A IA já informa o valor do frete durante a conversa de venda.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 group hover:border-purple-500/20 transition-all">
                    <ShieldCheck className="text-purple-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Link de rastreio temporário</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Cada link de acesso do entregador expira automaticamente após um período, protegendo a operação contra acessos indevidos.</p>
                </div>
            </section>

            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/20 max-w-2xl">
                <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    Esse módulo usa a mesma conexão de WhatsApp já configurada para o bot — não é preciso outro número ou outra ferramenta de rastreio.
                </p>
            </section>
        </div>
    );
}
