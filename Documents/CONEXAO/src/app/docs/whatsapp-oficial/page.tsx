import { ShieldCheck, Smartphone, Globe, ArrowRight, CheckCircle, KeyRound, AlertOctagon, Facebook } from "lucide-react";

export default function WhatsAppOficialDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="text-blue-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        WhatsApp Oficial (Meta Cloud API)
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    A conexão homologada diretamente pela Meta. Sem QR Code, sem risco de bloqueio por automação — seu número roda dentro da infraestrutura oficial do WhatsApp Business Platform, com limites de disparo e selo de qualidade geridos pela própria Meta.
                </p>
            </section>

            {/* Comparison callout */}
            <section className="p-6 glass rounded-[2rem] border border-white/10 bg-white/5 max-w-3xl flex items-start gap-4">
                <Globe className="text-indigo-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Esta é a <strong className="text-white not-italic">segunda forma</strong> de conectar um número de WhatsApp ao seu bot. Para a conexão rápida via QR Code (WuzAPI), veja{' '}
                    <span className="text-emerald-400 font-bold">WhatsApp (Uzapi)</span> no menu ao lado. Use a Meta Cloud API quando o cliente já possui (ou quer) um número comercial verificado, com maior volume de disparo e sem depender de um celular físico ligado 24h.
                </p>
            </section>

            {/* Connection Steps */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black underline decoration-blue-500 underline-offset-8 decoration-4">
                    <Facebook className="text-gray-400" /> Conexão via Embedded Signup
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-blue-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-4 shadow-xl">1</div>
                        <h4 className="text-white font-bold mb-2">Conectar com Facebook</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Em Meus Bots &gt; Conectar, escolha a aba &quot;WhatsApp Oficial (Meta)&quot; e clique em &quot;Conectar com Facebook&quot;.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-blue-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-4 shadow-xl">2</div>
                        <h4 className="text-white font-bold mb-2">Escolha o número</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Faça login com a conta do Gerenciador de Negócios (Business Manager) e selecione ou crie a WABA e o número comercial.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-blue-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-4 shadow-xl">3</div>
                        <h4 className="text-white font-bold mb-2">Pronto, sem QR Code</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">O sistema registra o número, gera o PIN de 2 fatores e assina o webhook automaticamente. Status muda para &quot;Conectado&quot;.</p>
                    </div>
                </div>
            </section>

            {/* Manual fallback */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-blue-500/5 max-w-3xl shadow-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4 italic font-black">
                    <KeyRound className="text-blue-400" /> Alternativa: Colar Credenciais Manualmente
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Se preferir gerar o token diretamente no painel de desenvolvedor da Meta (ou já tiver um Token de Sistema permanente), use o formulário manual em vez do botão de login social.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Phone Number ID</h5>
                        <p className="text-[10px] text-gray-500">ID do número no painel Meta for Developers.</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">WABA ID</h5>
                        <p className="text-[10px] text-gray-500">Obrigatório: sem ele o sistema não consegue assinar o webhook e as mensagens recebidas não chegam.</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Access Token</h5>
                        <p className="text-[10px] text-gray-500">Token temporário ou permanente (Usuário de Sistema) gerado no app da Meta.</p>
                    </div>
                </div>
            </section>

            {/* Requirements for going live */}
            <section className="space-y-6 max-w-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black">
                    <ShieldCheck className="text-emerald-400" /> Verificações necessárias na Meta
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Antes de enviar mensagens para números reais fora do modo de teste, a conta de negócios (Business Manager) precisa concluir as verificações da Meta. São etapas separadas, cada uma com seu próprio prazo:
                </p>
                <div className="space-y-4">
                    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-start gap-4">
                        <CheckCircle className="text-emerald-500 shrink-0 mt-1" size={18} />
                        <div>
                            <h5 className="text-white font-black text-xs uppercase tracking-widest mb-1">Verificação de Negócio (Business Verification)</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">Confirma a identidade legal da empresa dona do Business Manager (CNPJ e documentos). Necessária para destravar limites maiores de envio.</p>
                        </div>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-start gap-4">
                        <CheckCircle className="text-emerald-500 shrink-0 mt-1" size={18} />
                        <div>
                            <h5 className="text-white font-black text-xs uppercase tracking-widest mb-1">Verificação de Acesso (Tech Provider)</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">Necessária quando o app é usado para conectar contas de clientes (uso como provedor de tecnologia). Libera o modo Live para as WABAs sob o seu Business Manager.</p>
                        </div>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-start gap-4">
                        <AlertOctagon className="text-yellow-500 shrink-0 mt-1" size={18} />
                        <div>
                            <h5 className="text-white font-black text-xs uppercase tracking-widest mb-1">App Review (Advanced Access)</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">Só é exigido quando o app vai operar em produção com números de <strong className="not-italic text-gray-300">clientes de terceiros</strong> em escala (uso como Solution/Tech Provider para múltiplas agências). Exige vídeo de demonstração do fluxo funcionando — por isso deve ser solicitado depois das verificações acima, nunca antes.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical flow */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="p-6 glass rounded-2xl border border-white/5 bg-black/40">
                    <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">Recebimento (Inbound)</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">A Meta envia a mensagem via Webhook (HTTPS) diretamente para o Conext Bot, sem depender de nenhum celular ligado ou sessão de navegador ativa.</p>
                </div>
                <div className="p-6 glass rounded-2xl border border-white/5 bg-black/40">
                    <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">Resposta (Outbound)</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">O sistema chama a Graph API da Meta para enviar texto, áudio ou mídia de volta, respeitando os limites de mensageria da sua camada (Tier) de qualidade.</p>
                </div>
            </section>

            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/20 max-w-2xl">
                <ShieldCheck size={28} className="text-blue-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    Recomendado para agências que atendem clientes com alto volume de mensagens ou que exigem número comercial verificado com selo oficial no WhatsApp.
                </p>
            </section>
        </div>
    );
}
