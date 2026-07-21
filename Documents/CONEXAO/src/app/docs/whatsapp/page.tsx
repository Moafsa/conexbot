import { Zap, ShieldCheck, Smartphone, Globe, ArrowRight, CheckCircle, Binary } from "lucide-react";

export default function WhatsAppDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Zap className="text-emerald-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        WhatsApp via QR Code (Uzapi)
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    A forma mais rápida de conectar: escaneie um QR Code com qualquer número de WhatsApp e comece a vender em menos de um minuto. Ideal para começar rápido ou para operações menores.
                </p>
            </section>

            {/* Comparison callout */}
            <section className="p-6 glass rounded-[2rem] border border-white/10 bg-white/5 max-w-3xl flex items-start gap-4">
                <Globe className="text-blue-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-gray-400 leading-relaxed">
                    Existe uma <strong className="text-white not-italic">segunda forma</strong> de conectar, homologada diretamente pela Meta, sem depender de um celular ligado 24h e com maior limite de disparo: veja{' '}
                    <span className="text-blue-400 font-bold">WhatsApp Oficial (Meta Cloud API)</span> no menu ao lado. Use o QR Code (esta página) para validar rápido ou operar com baixo volume; use a Meta Oficial para operações maiores ou clientes que exigem número comercial verificado.
                </p>
            </section>

            {/* Connection Steps */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black underline decoration-emerald-500 underline-offset-8 decoration-4">
                    <Smartphone className="text-gray-400" /> Como Conectar sua Instância
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-emerald-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-4 shadow-xl">1</div>
                        <h4 className="text-white font-bold mb-2">Acesse Meus Bots</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Localize o bot que deseja conectar e clique no ícone de "Link" ou "Conectar".</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-emerald-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-4 shadow-xl">2</div>
                        <h4 className="text-white font-bold mb-2">QR Code Scan</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">Escaneie o código gerado usando o "Aparelhos Conectados" do seu WhatsApp Celular.</p>
                    </div>
                    <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 hover:border-emerald-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-4 shadow-xl">3</div>
                        <h4 className="text-white font-bold mb-2">Pronto!</h4>
                        <p className="text-xs text-gray-500 leading-relaxed italic">O status mudará automaticamente para "Conectado" e a IA começará a responder.</p>
                    </div>
                </div>
            </section>

            {/* Technical Flow Section (Consolidated from Uzapi) */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black">
                    <Binary className="text-indigo-400" /> Como as mensagens fluem?
                </h2>
                <div className="grid md:grid-cols-2 gap-6 relative">
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-black/40">
                        <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">Recebimento (Inbound)</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Quando um cliente envia uma mensagem, o motor Uzapi a recebe e encaminha via Webhook para o Conext Bot processar com IA e RAG.</p>
                    </div>
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-black/40">
                        <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">Resposta (Outbound)</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Após a IA gerar o texto ou áudio (ElevenLabs), o sistema usa a Uzapi para disparar a resposta de volta ao cliente em milissegundos.</p>
                    </div>
                    {/* Arrow between them */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block opacity-20">
                        <ArrowRight size={24} className="text-indigo-400" />
                    </div>
                </div>
            </section>

            {/* Maintenance */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-emerald-500/5 max-w-2xl shadow-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4 italic font-black">
                    <ShieldCheck className="text-emerald-400" /> Estabilidade e Segurança
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6 italic border-l-2 border-emerald-500/20 pl-4 py-1">
                    "Sua sessão permanece ativa 24 horas por dia. Se o aparelho ficar offline por longos períodos, o WhatsApp pode exigir um novo escaneamento."
                </p>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-white/5">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sessão Persistente</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-white/5">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Suporte a Áudio/Voz</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
