import { Layout, Zap, Rocket, ShoppingCart, MessageSquare, Globe, Download, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WordPressDocsPage() {
    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Hero */}
            <section className="relative overflow-hidden p-10 rounded-[2.5rem] bg-blue-500/5 border border-white/5">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <Globe className="text-blue-400 animate-pulse" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Plugin WordPress & Woo
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg mb-8 max-w-xl relative z-10">
                    Sincronize sua loja WooCommerce e blog diretamente com o cérebro da sua IA. Responda comentários e venda produtos de forma autônoma.
                </p>
                <Link 
                    href="/conexbot-wp.zip"
                    download
                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black transition-all shadow-2xl shadow-blue-600/30 group relative z-10"
                >
                    <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                    Download Plugin (.zip)
                </Link>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </section>

            {/* Core Features Grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/30 transition-all">
                    <Zap className="text-blue-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">Atendimento Híbrido</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">O mesmo robô gerencia comentários no blog e conversas no WhatsApp simultaneamente usando o contexto do seu site.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/30 transition-all">
                    <ShoppingCart className="text-emerald-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">WooCommerce Sync</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Sincronização instantânea de preço, estoque e descrições para a base de conhecimento (RAG) da IA.</p>
                </div>
            </section>

            {/* Step by Step Setup */}
            <section className="space-y-10 max-w-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-blue-500 underline-offset-8">
                    <Rocket className="text-blue-500" /> Guia de Instalação
                </h2>
                
                <div className="space-y-6">
                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">01.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Download e Ativação</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">
                                Baixe o arquivo <code className="text-purple-300 not-italic">.zip</code> do plugin no seu painel Conext (ou o link acima) e instale via{' '}
                                <strong className="not-italic">Plugins &gt; Adicionar Novo</strong> no seu WordPress.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">02.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Chave de API (Token)</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">
                                Em <strong className="not-italic">ConextBot &gt; Configurações</strong>, insira seu Token de API pessoal para validar a conexão segura com nosso servidor.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">03.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">ID do Bot (UUID)</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Cole o identificador do robô criado no Arquiteto. Isso determina qual "cérebro" responderá seus clientes e comentários.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical Logic Section */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl max-w-2xl relative group">
                <h3 className="text-xl font-black text-white flex items-center gap-3 italic mb-6">
                    <ShieldCheck className="text-indigo-400" /> Logística de Atendimento
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6 italic border-l-2 border-indigo-500/20 pl-4 py-1">
                    Como o plugin decide para onde enviar a resposta?
                </p>
                <ul className="space-y-4 text-[11px] text-gray-500">
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Comentários Web:</strong> A IA responde diretamente na thread do post ou produto do site.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Clientes com JID (WhatsApp):</strong> Se o plugin detectar um vínculo, ele encaminha a resposta via WuzAPI no celular do cliente.</p>
                    </li>
                </ul>
            </section>

            {/* Final tip */}
            <section className="flex items-center gap-4 p-6 border border-white/5 rounded-2xl bg-white/5 max-w-2xl group hover:bg-white/10 transition-all">
                <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    💡 **Dica PRO:** Use o botão "Sincronizar Tudo" para enviar seu acervo atual. Mudanças futuras em estoque e preços serão replicadas instantaneamente via Webhook.
                </p>
            </section>
        </div>
    );
}
