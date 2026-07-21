import { Megaphone, Sparkles, CalendarClock, Target, ShareIcon, Search, CheckCircle } from "lucide-react";

export default function MarketingDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Megaphone className="text-fuchsia-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Marketing &amp; Anúncios IA
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Central de conteúdo e anúncios pagos para Instagram e Facebook. A IA gera posts, monta o calendário, dispara campanhas e ainda usa as conversas reais dos leads do bot como insumo de estratégia.
                </p>
            </section>

            {/* Requirement */}
            <section className="p-6 glass rounded-[2rem] border border-white/10 bg-white/5 max-w-3xl flex items-start gap-4">
                <ShareIcon className="text-fuchsia-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Requer o canal <strong className="text-white not-italic">Instagram</strong> (ou Facebook) já conectado no bot para publicar de fato. Sem isso, o módulo ainda gera o conteúdo, mas não publica automaticamente.
                </p>
            </section>

            {/* Features grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-fuchsia-500/5 group hover:border-fuchsia-500/20 transition-all">
                    <Sparkles className="text-fuchsia-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Geração de posts com IA</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Legenda + imagem (ou roteiro de vídeo/carrossel) gerados a partir do contexto do negócio, produtos e base de conhecimento do bot.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-indigo-500/5 group hover:border-indigo-500/20 transition-all">
                    <Target className="text-indigo-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Estratégia baseada em conversas reais</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">A IA analisa as conversas mais recentes dos leads do WhatsApp/Instagram para entender dúvidas e objeções, e usa isso para ajustar os próximos conteúdos.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/20 transition-all">
                    <CalendarClock className="text-blue-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Calendário e agendamento</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Programe posts para publicação automática na data e hora definidas — inclusive em lote.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/20 transition-all">
                    <Search className="text-emerald-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Pesquisa de palavras-chave</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Volume de busca e CPC estimado para orientar tanto o conteúdo orgânico quanto os anúncios pagos.</p>
                </div>
            </section>

            {/* Ads section */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl space-y-4">
                <h3 className="text-xl font-black text-white flex items-center gap-3 italic">
                    <Megaphone className="text-fuchsia-400" /> Anúncios (Meta Ads)
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                    Crie e acompanhe campanhas de anúncios no Facebook/Instagram diretamente do painel, ou impulsione (&quot;boost&quot;) um post já publicado com poucos cliques. As campanhas e resultados ficam listados junto ao restante do conteúdo, sem precisar abrir o Gerenciador de Anúncios da Meta.
                </p>
            </section>

            {/* Approval / offers */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-3">Aprovação do Cliente</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Gere um link de revisão para o cliente aprovar (ou pedir ajuste) em um post antes dele ir ao ar — sem precisar dar acesso ao painel.</p>
                </div>
                <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-3">Ofertas Prontas</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Gere páginas de oferta/promoção com copy pronta para compartilhar em um link público, ideal para campanhas relâmpago.</p>
                </div>
            </section>

            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/20 max-w-2xl">
                <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    Diferente do Conext Writer (focado em SEO para blog/WordPress), este módulo é focado em redes sociais e mídia paga.
                </p>
            </section>
        </div>
    );
}
