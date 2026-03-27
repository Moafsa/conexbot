import { Settings, ShieldCheck, Key, Bot, DollarSign, AudioLines } from "lucide-react";

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
                <p className="text-gray-400 leading-relaxed text-lg">
                    O ConextBot é agnóstico de provedor. Você traz suas próprias chaves de API e mantém o controle total sobre o custo e a performance da sua operação.
                </p>
            </section>

            {/* API Keys Configuration */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Key className="text-yellow-400" /> Configuração de APIs (Passo a Passo)
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {/* OpenAI */}
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-emerald-500/5">
                        <Bot className="text-emerald-400 mb-4" />
                        <h4 className="font-bold text-white mb-2">OpenAI (Cérebro)</h4>
                        <ul className="text-xs text-gray-500 space-y-2">
                            <li><strong>Modelos:</strong> GPT-4o, GPT-4o-mini (Recomendado).</li>
                            <li><strong>Onde inserir:</strong> Vá em **Configurações {" > "} IA**.</li>
                            <li><strong>Exemplo:</strong> `sk-proj-...`</li>
                        </ul>
                    </div>

                    {/* ElevenLabs */}
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-pink-500/5">
                        <AudioLines className="text-pink-400 mb-4" />
                        <h4 className="font-bold text-white mb-2">ElevenLabs (Voz)</h4>
                        <ul className="text-xs text-gray-500 space-y-2">
                            <li><strong>Função:</strong> Gera áudios realistas no WhatsApp.</li>
                            <li><strong>Sincronização:</strong> O ID da voz deve ser o mesmo cadastrado no seu painel ElevenLabs.</li>
                        </ul>
                    </div>

                    {/* Asaas */}
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-blue-500/5">
                        <DollarSign className="text-blue-400 mb-4" />
                        <h4 className="font-bold text-white mb-2">Asaas (Pagamentos)</h4>
                        <ul className="text-xs text-gray-500 space-y-2">
                            <li><strong>Chave API:</strong> Necessário para gerar PIX e faturas no chat.</li>
                            <li><strong>Webhook:</strong> Certifique-se de configurar a URL de retorno no Asaas.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Global vs Tenant */}
            <section className="bg-white/5 p-8 rounded-3xl border border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                    <ShieldCheck className="text-indigo-400" /> Segurança e Hierarquia
                </h3>
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        O sistema possui dois níveis de configuração de chaves:
                    </p>
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl border border-white/10 bg-black/40">
                            <h5 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-1">Chaves Globais (Admin)</h5>
                            <p className="text-xs text-gray-500 italic">Usadas como fallback caso o cliente não tenha inserido sua própria chave.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-white/10 bg-indigo-500/10 border-indigo-500/20">
                            <h5 className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Chaves por Bot/Tenant</h5>
                            <p className="text-xs text-gray-400 font-medium">Sobrescrevem as do sistema. Ideal para whitelabel ou controle de custos individuais.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Error Troubleshooting */}
            <section>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-200 font-medium">⚠️ Erro `401 Unauthorized` ou `Model not found`?</p>
                    <p className="text-xs text-red-300/80 mt-1 italic">Verifique se sua chave da OpenAI tem saldo positivo e suporte ao GPT-4o-mini. Chaves recém-criadas podem levar 5 minutos para propagar.</p>
                </div>
            </section>
        </div>
    );
}

