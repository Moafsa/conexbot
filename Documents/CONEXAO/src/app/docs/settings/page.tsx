import { Settings, ShieldCheck, Key, Bot, DollarSign, AudioLines, Info, AlertOctagon } from "lucide-react";

export default function SettingsDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Title Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="text-gray-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Chaves & Configurações
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    O ConextBot é agnóstico de provedor. Você traz suas próprias chaves de API e mantém o controle total sobre o custo, privacidade e performance da sua operação.
                </p>
            </section>

            {/* API Keys Configuration Grid */}
            <section className="space-y-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-yellow-500 underline-offset-8">
                    <Key className="text-yellow-400" /> Configuração de APIs
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    {/* OpenAI */}
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/30 transition-all flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                            <Bot size={28} />
                        </div>
                        <h4 className="font-black text-white mb-3 uppercase tracking-widest text-[10px]">OpenAI (Cérebro Central)</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">Recomendamos GPT-4o-mini pelo custo-benefício ou GPT-4o para tarefas complexas.</p>
                        <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono text-gray-600">sk-proj-...</div>
                    </div>

                    {/* ElevenLabs */}
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-pink-500/5 group hover:border-pink-500/30 transition-all flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6">
                            <AudioLines size={28} />
                        </div>
                        <h4 className="font-black text-white mb-3 uppercase tracking-widest text-[10px]">ElevenLabs (Voz Humana)</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">Gera áudios ultra-realistas. Copie o "Voice ID" do seu painel ElevenLabs e cole no bot.</p>
                        <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono text-gray-600">voice_id: 21mO...</div>
                    </div>

                    {/* Asaas */}
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/30 transition-all flex flex-col items-center text-center md:col-span-2 max-w-xl mx-auto w-full">
                        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                            <DollarSign size={28} />
                        </div>
                        <h4 className="font-black text-white mb-3 uppercase tracking-widest text-[10px]">Asaas (Pagamentos e Split)</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">Essencial para gerar links de PIX e monitorar pagamentos. Use sua "Chave API de Produção".</p>
                        <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono text-gray-600">$aapi_...</div>
                    </div>
                </div>
            </section>

            {/* Global vs Tenant Section */}
            <section className="p-10 glass rounded-[3rem] border border-white/10 bg-black/40 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
                <h3 className="text-2xl font-black text-white flex items-center gap-3 italic mb-8 underline decoration-indigo-500 underline-offset-8">
                    <ShieldCheck className="text-indigo-400" /> Segurança e Hierarquia
                </h3>
                <div className="space-y-6 max-w-2xl relative z-10">
                    <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-indigo-500/20 pl-6 py-2">
                        "O sistema possui dois níveis de configuração de chaves para garantir que seu assistente nunca fique offline."
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-6 rounded-[1.5rem] border border-white/5 bg-white/5 group hover:bg-white/10 transition-all">
                            <h5 className="text-[10px] font-black text-gray-100 uppercase tracking-widest mb-2">Chaves Globais (Admin)</h5>
                            <p className="text-[10px] text-gray-500 leading-relaxed italic">Usadas como fallback (reserva) caso um robô individual não tenha suas próprias chaves.</p>
                        </div>
                        <div className="p-6 rounded-[1.5rem] border border-indigo-500/30 bg-indigo-500/10 group hover:border-indigo-500/60 transition-all shadow-xl">
                            <h5 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Chaves por Bot (Tenant)</h5>
                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed italic">Sobrescrevem as do sistema. Ideal para whitelabel ou isolamento total de custos.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Troubleshooting Alert Section */}
            <section className="p-8 border border-white/5 rounded-[2.5rem] bg-red-500/5 max-w-2xl flex items-center gap-6 group hover:bg-red-500/10 transition-all">
                <AlertOctagon size={32} className="text-red-500 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                    <p className="text-sm text-red-200 font-black uppercase tracking-widest mb-1">Erro `401` ou `Model not found`?</p>
                    <p className="text-xs text-red-300/60 leading-relaxed italic italic">Verifique se sua chave da OpenAI tem saldo positivo. Chaves recém-criadas podem levar até 5 minutos para propagar no servidor.</p>
                </div>
            </section>
        </div>
    );
}
