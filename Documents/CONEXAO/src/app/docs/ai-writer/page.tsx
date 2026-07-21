import { Layout, Zap, Rocket, PenTool, Sparkles, Globe, Download, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AIWriterDocsPage() {
    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Hero */}
            <section className="relative overflow-hidden p-10 rounded-[2.5rem] bg-indigo-500/5 border border-white/5">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <PenTool className="text-indigo-400 animate-pulse" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Conext Writer
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg mb-8 max-w-xl relative z-10">
                    Transforme seu blog WordPress em uma máquina de conteúdo orgânico. Pesquisa, escrita e publicação automática com SEO de alto nível.
                </p>
                <Link 
                    href="/conext-writer.zip"
                    download
                    className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black transition-all shadow-2xl shadow-indigo-600/30 group relative z-10"
                >
                    <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                    Download Plugin (.zip)
                </Link>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </section>

            {/* Core Features Grid */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-indigo-500/5 group hover:border-indigo-500/30 transition-all">
                    <Sparkles className="text-indigo-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">Escrita Autônoma</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">A IA pesquisa tendências em tempo real e escreve artigos completos de até 5.000 palavras sem intervenção humana.</p>
                </div>
                <div className="p-10 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/30 transition-all">
                    <Rocket className="text-emerald-400 mb-6" size={28} />
                    <h3 className="text-white font-black mb-3 uppercase tracking-widest text-[10px]">SEO Pro Max</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Otimização automática de Meta Tags, Focus Keyword e linkagem interna compatível com Yoast SEO.</p>
                </div>
            </section>

            {/* Step by Step Setup */}
            <section className="space-y-10 max-w-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-indigo-500 underline-offset-8">
                    <Zap className="text-indigo-500" /> Ativação e Configuração
                </h2>
                
                <div className="space-y-6">
                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">01.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Instalação via ZIP</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Baixe o `.zip` acima e instale em **Plugins &gt; Adicionar Novo &gt; Fazer Upload** no seu WordPress.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">02.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Chave de Licença</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Acesse a aba **Licenciamento** no menu do plugin e insira sua chave `CNX-XXXX`, gerada após a assinatura do plano.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-black text-white text-xs border-4 border-white/5 shadow-2xl">03.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-2">Modelos de IA</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Configure suas chaves da OpenAI ou Google Gemini para dar "vida" ao redator. O plugin suporta GPT-4o e Gemini 1.5 Pro.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Usage limits info */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl max-w-2xl relative group">
                <h3 className="text-xl font-black text-white flex items-center gap-3 italic mb-6">
                    <ShieldCheck className="text-indigo-400" /> Regras de Consumo
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6 italic border-l-2 border-indigo-500/20 pl-4 py-1">
                    Como funcionam os créditos no seu plano?
                </p>
                <ul className="space-y-4 text-[11px] text-gray-500">
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Créditos de Post:</strong> Cada artigo gerado e publicado debita 1 crédito do seu limite mensal.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Limite de Palavras:</strong> O sistema rastreia o total de palavras geradas para garantir a estabilidade da sua conta.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Teste Grátis:</strong> Contas em período de teste (trial) têm um limite de 5 posts gerados antes de exigir assinatura ativa.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Renovação:</strong> Seus créditos são resetados automaticamente a cada novo ciclo de pagamento (30 dias).</p>
                    </li>
                </ul>
            </section>

            {/* License key lifecycle */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-indigo-500/5 max-w-2xl relative group">
                <h3 className="text-xl font-black text-white flex items-center gap-3 italic mb-6">
                    <Sparkles className="text-indigo-400" /> Como a Chave `CNX-XXXX` Funciona
                </h3>
                <ul className="space-y-4 text-[11px] text-gray-500">
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Emissão automática:</strong> A chave é gerada sozinha no momento em que a assinatura do Conext Writer é criada — não é preciso pedir nem gerar manualmente. Ela fica disponível para copiar em Meus Bots &gt; Writer.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Vínculo ao site:</strong> Ao ativar a chave no plugin, ela é vinculada à URL do WordPress. Trocar de domínio atualiza o vínculo automaticamente na próxima verificação.</p>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <p><strong>Verificação em cada uso:</strong> Antes de gerar um artigo, o plugin consulta o servidor para confirmar que a assinatura está ativa e que ainda há créditos de posts/palavras disponíveis no plano.</p>
                    </li>
                </ul>
            </section>

            {/* Final tip */}
            <section className="flex items-center gap-4 p-6 border border-white/5 rounded-2xl bg-white/5 max-w-2xl group hover:bg-white/10 transition-all">
                <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    💡 **Dica PRO:** Combine o AI Writer com o Conexbot WhatsApp para que a IA use os artigos do seu blog como base de conhecimento para vender no chat!
                </p>
            </section>
        </div>
    );
}
