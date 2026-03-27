import { Layout, Zap, Rocket, ShoppingCart, MessageSquare, Globe, Download } from "lucide-react";
import Link from "next/link";

export default function WordPressDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="text-blue-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                        Plugin WordPress & WooCommerce
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg mb-8">
                    Transforme seu site WordPress em uma máquina de vendas autônoma. O plugin ConextBot conecta seu estoque, blog e atendimento diretamente à nossa IA.
                </p>
                <Link 
                    href="/conexbot-wp.zip"
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 group"
                >
                    <Download size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                    Baixar Plugin (.zip)
                </Link>
            </section>

            {/* Core Features */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-6 glass rounded-3xl border border-white/5 bg-blue-500/5">
                    <Zap className="text-blue-400 mb-4" size={24} />
                    <h3 className="text-white font-bold mb-2">Canal Híbrido</h3>
                    <p className="text-sm text-gray-500">O mesmo robô gerencia comentários no blog/loja e conversas no WhatsApp simultaneamente.</p>
                </div>
                <div className="p-6 glass rounded-3xl border border-white/5 bg-green-500/5">
                    <ShoppingCart className="text-green-400 mb-4" size={24} />
                    <h3 className="text-white font-bold mb-2">Sync WooCommerce</h3>
                    <p className="text-sm text-gray-500">Sincronização em tempo real de preço, estoque e descrição de produtos para a base de conhecimento.</p>
                </div>
            </section>

            {/* Step by Step */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Rocket className="text-purple-500" /> Passo a Passo de Instalação
                </h2>
                
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-white">1</div>
                        <div>
                            <h4 className="font-bold text-gray-200 uppercase text-xs tracking-widest mb-1">Download e Ativação</h4>
                            <p className="text-sm text-gray-400">Baixe o arquivo `.zip` do plugin no seu painel Conext e instale via **Plugins > Adicionar Novo** no seu WordPress.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-white">2</div>
                        <div>
                            <h4 className="font-bold text-gray-200 uppercase text-xs tracking-widest mb-1">Conexão Segura</h4>
                            <p className="text-sm text-gray-400">Vá no menu **ConextBot** no WordPress e insira seu **API Token**. O sistema validará a conexão automaticamente.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-white">3</div>
                        <div>
                            <h4 className="font-bold text-gray-200 uppercase text-xs tracking-widest mb-1">Vínculo de IA (Arquiteto)</h4>
                            <p className="text-sm text-gray-400">No campo **ID do Bot (UUID)**, cole o identificador do agente que você criou no Arquiteto. Isso determina qual "cérebro" responderá seus clientes.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works below the hood */}
            <section className="p-8 glass rounded-3xl border border-white/10 bg-white/5 space-y-4">
                <h3 className="text-xl font-bold text-white italic underline decoration-purple-500 underline-offset-8">Como funciona o atendimento duplo?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    O plugin monitora o hook `wp_insert_comment`. Quando um novo comentário entra:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-500 space-y-2 ml-4">
                    <li><strong>Caso seja um cliente Web:</strong> A IA responde diretamente no comentário do post ou produto.</li>
                    <li><strong>Caso seja um contato de WhatsApp (LID):</strong> O plugin detecta o JID do cliente e instrui o servidor a enviar a resposta via WhatsApp (WuzAPI).</li>
                </ul>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mt-4">
                    <p className="text-xs text-yellow-200 font-medium italic">
                        💡 Dica: Use o botão "Sincronizar Tudo" para enviar seu catálogo atual imediatamente. Mudanças futuras serão sincronizadas via Webhook automaticamente.
                    </p>
                </div>
            </section>
        </div>
    );
}

