import { Gauge, Zap, ShieldCheck, Share2, ListChecks, ImageIcon, CheckCircle, Download, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AISeoOptimizerDocsPage() {
    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Hero */}
            <section className="relative overflow-hidden p-10 rounded-[2.5rem] bg-emerald-500/5 border border-white/5">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <Gauge className="text-emerald-400 animate-pulse" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Conext AI SEO Optimizer
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg mb-8 max-w-xl relative z-10">
                    Plugin de WordPress que reescreve o SEO de páginas, posts e produtos WooCommerce já existentes com IA — título, meta descrição, palavra-chave, conteúdo e imagens — e ainda otimiza tudo para aparecer em respostas do ChatGPT, Claude e Perplexity (GEO).
                </p>
                <Link
                    href="/conext-ai-seo-optimizer.zip"
                    download
                    className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black transition-all shadow-2xl shadow-emerald-600/30 group relative z-10"
                >
                    <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                    Download Plugin (.zip)
                </Link>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </section>

            {/* Difference vs Conext Writer */}
            <section className="p-6 glass rounded-[2rem] border border-white/10 bg-white/5 max-w-3xl flex items-start gap-4">
                <Sparkles className="text-indigo-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Diferente do <strong className="text-white not-italic">Conext Writer</strong> (que cria artigos novos do zero para o blog), o SEO Optimizer trabalha em cima do que <strong className="text-white not-italic">já existe</strong> no site: reescreve e otimiza páginas, posts e produtos que o cliente já publicou. Os dois se complementam.
                </p>
            </section>

            {/* No license needed */}
            <section className="p-6 glass rounded-[2rem] border border-white/10 bg-emerald-500/5 max-w-3xl flex items-start gap-4">
                <ShieldCheck className="text-emerald-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Este plugin é <strong className="text-white not-italic">independente</strong>: não exige login nem chave de licença do Conext Bot. O cliente usa a própria chave de API (Gemini, OpenAI ou Claude) diretamente no painel do WordPress dele.
                </p>
            </section>

            {/* Setup steps */}
            <section className="space-y-10 max-w-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-emerald-500 underline-offset-8">
                    <Zap className="text-emerald-500" /> Ativação e Configuração
                </h2>

                <div className="space-y-6">
                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">01.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Instalação via ZIP</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Baixe o `.zip` acima e instale em <strong className="not-italic">Plugins &gt; Adicionar Novo &gt; Fazer Upload</strong> no WordPress do cliente.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">02.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Escolha o provedor de IA</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">No menu <strong className="not-italic">Conext AI SEO</strong>, escolha Gemini (recomendado, tem chave gratuita no Google AI Studio), OpenAI ou Claude, e cole a chave de API correspondente.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">03.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Selecione o que otimizar</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Marque quais tipos de conteúdo entram na otimização: Posts, Páginas, Produtos (WooCommerce) ou qualquer custom post type público do site.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/30 transition-all">
                    <ListChecks className="text-emerald-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">Um clique ou em massa</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Otimize um item direto no editor (botão na barra lateral) ou rode uma varredura completa do site e otimize dezenas de páginas/produtos em lote, com log e barra de progresso em tempo real.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-indigo-500/5 group hover:border-indigo-500/30 transition-all">
                    <ShieldCheck className="text-indigo-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">Fallback automático entre IAs</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Se o provedor escolhido falhar (sem crédito, fora do ar), o plugin tenta automaticamente os outros provedores configurados antes de desistir da otimização.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/30 transition-all">
                    <CheckCircle className="text-blue-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">Yoast &amp; RankMath nativo</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Escreve direto nos campos de palavra-chave em foco, título SEO e meta descrição do Yoast SEO e do RankMath — os dois plugins de SEO mais usados no WordPress — sem precisar copiar e colar nada.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-orange-500/5 group hover:border-orange-500/30 transition-all">
                    <ImageIcon className="text-orange-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">SEO de imagens</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Renomeia automaticamente os arquivos de imagem enviados para slugs amigáveis e preenche o texto alternativo (alt text) com base no conteúdo relacionado.</p>
                </div>
            </section>

            {/* GEO / Graphify */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl max-w-3xl relative group">
                <h3 className="text-xl font-black text-white flex items-center gap-3 italic mb-6">
                    <Share2 className="text-emerald-400" /> GEO &amp; Grafo de Conhecimento (Graphify)
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Cada conteúdo otimizado ganha uma estrutura pensada para ser citada por motores de resposta de IA, não só para ranquear no Google:
                </p>
                <ul className="space-y-3 text-[11px] text-gray-500 mb-6">
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <p><strong>Resumo TL;DR</strong> no topo do texto, ideal para leitura rápida por crawlers de IA.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <p><strong>Seção de perguntas frequentes</strong> curtas e diretas, formato ideal para citação em ChatGPT/Perplexity.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <p><strong>Links internos relevantes</strong> escolhidos automaticamente com base numa análise de relacionamento do próprio site.</p>
                    </li>
                </ul>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    Além disso, o plugin expõe publicamente um grafo do site inteiro (páginas, produtos, categorias e como se conectam) em duas URLs que crawlers de IA conseguem ler diretamente:
                </p>
                <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-2 bg-black/40 rounded-full border border-white/5 text-[10px] font-mono text-emerald-300">/conext-graph.json</span>
                    <span className="px-4 py-2 bg-black/40 rounded-full border border-white/5 text-[10px] font-mono text-emerald-300">/conext-graph-report.md</span>
                </div>
            </section>

            {/* Final tip */}
            <section className="flex items-center gap-4 p-6 border border-white/5 rounded-2xl bg-white/5 max-w-2xl group hover:bg-white/10 transition-all">
                <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    💡 <strong className="not-italic">Dica de venda:</strong> ótimo produto de entrada — o cliente já tem site e produtos publicados, mas nunca fez SEO direito. Rode a varredura em massa numa demonstração e mostre quantos itens saem de &quot;Não Otimizado&quot; para otimizado em minutos.
                </p>
            </section>
        </div>
    );
}
