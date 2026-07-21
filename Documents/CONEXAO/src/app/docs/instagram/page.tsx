import { Instagram, Facebook, ImageIcon, MessageCircle, CheckCircle, ShieldCheck } from "lucide-react";

export default function InstagramDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Instagram className="text-pink-500" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Instagram Direct
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Leve o mesmo cérebro de IA do WhatsApp para o Direct do Instagram. O bot responde comentários e mensagens diretas, e você ainda consegue publicar conteúdo no feed direto do painel.
                </p>
            </section>

            {/* Requirements */}
            <section className="p-6 glass rounded-[2rem] border border-white/10 bg-white/5 max-w-3xl flex items-start gap-4">
                <ShieldCheck className="text-pink-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Pré-requisito: a conta do Instagram precisa ser <strong className="text-white not-italic">Profissional (Business ou Criador de Conteúdo)</strong> e estar vinculada a uma Página do Facebook. Contas pessoais não são suportadas pela API da Meta.
                </p>
            </section>

            {/* Connection Steps */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black underline decoration-pink-500 underline-offset-8 decoration-4">
                    <Facebook className="text-gray-400" /> Como Conectar
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-pink-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold mb-4 shadow-xl">1</div>
                        <h4 className="text-white font-bold mb-2">Conectar Instagram</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Em Meus Bots &gt; Conectar, aba &quot;Instagram&quot;, clique em conectar e faça login com a conta do Facebook dona da Página.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-pink-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold mb-4 shadow-xl">2</div>
                        <h4 className="text-white font-bold mb-2">Autorize os acessos</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Aceite as permissões de mensagens, comentários e publicação. O sistema localiza automaticamente a Página com Instagram vinculado.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-pink-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold mb-4 shadow-xl">3</div>
                        <h4 className="text-white font-bold mb-2">Pronto!</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">O webhook do Direct é assinado automaticamente e o status muda para &quot;Conectado&quot;.</p>
                    </div>
                </div>
            </section>

            {/* Features grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-pink-500/5 group hover:border-pink-500/20 transition-all">
                    <MessageCircle className="text-pink-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Direct automático</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">A mesma IA treinada para o WhatsApp responde automaticamente as mensagens diretas do Instagram, usando o mesmo RAG e CRM.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 group hover:border-purple-500/20 transition-all">
                    <ImageIcon className="text-purple-400 mb-4" size={24} />
                    <h4 className="text-white font-bold mb-2">Publicação de feed</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Publique imagens, vídeos e reels com legenda diretamente pelo painel, sem precisar abrir o app do Instagram.</p>
                </div>
            </section>

            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/20 max-w-2xl">
                <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    Dica: combine o Instagram com o módulo de <strong className="not-italic text-gray-300">Marketing &amp; Anúncios IA</strong> para agendar posts e anúncios que caem direto nesse mesmo canal conectado.
                </p>
            </section>
        </div>
    );
}
