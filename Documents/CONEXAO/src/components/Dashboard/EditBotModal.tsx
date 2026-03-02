
import { useState, useEffect } from "react";
import { X, Save, RefreshCw } from "lucide-react";

interface EditBotModalProps {
    isOpen: boolean;
    onClose: () => void;
    botData: any;
    onSave: (updatedData: any) => void;
}

const MODELS_BY_PROVIDER: Record<string, { id: string, name: string }[]> = {
    openai: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4o', name: 'GPT-4o (Completo)' },
        { id: 'o1-mini', name: 'o1 Mini' },
    ],
    gemini: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy)' },
    ],
    openrouter: [
        { id: 'x-ai/grok-2', name: 'Grok 2 (xAI)' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'meta-llama/llama-3.1-405b', name: 'Llama 3.1 405B' },
        { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (via OpenRouter)' },
    ]
};

const getDefaultModel = (provider: string) => MODELS_BY_PROVIDER[provider]?.[0]?.id || "";
const getAvailableModels = (provider: string) => MODELS_BY_PROVIDER[provider] || [];

export default function EditBotModal({ isOpen, onClose, botData, onSave }: EditBotModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        businessType: "",
        description: "",
        systemPrompt: "",
        webhookUrl: "",
        webhookToken: "",
        chatwootUrl: "",
        chatwootToken: "",
        chatwootAccountId: "",
        aiProvider: "openai",
        aiModel: "gpt-4o-mini",
        voiceId: ""
    });
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if (isOpen && botData) {
            setFormData({
                name: botData.name || "",
                businessType: botData.businessType || "",
                description: botData.description || "",
                systemPrompt: botData.systemPrompt || "",
                webhookUrl: botData.webhookUrl || "",
                webhookToken: botData.webhookToken || "",
                chatwootUrl: botData.chatwootUrl || "",
                chatwootToken: botData.chatwootToken || "",
                chatwootAccountId: botData.chatwootAccountId || "",
                aiProvider: botData.aiProvider || "openai",
                aiModel: botData.aiModel || "gpt-4o-mini",
                voiceId: botData.voiceId || ""
            });
        }
    }, [isOpen, botData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        ✏️ Editar Identidade do Agente
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Nome do Agente</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ex: Pedro - Vendas"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Tipo de Negócio</label>
                            <input
                                type="text"
                                value={formData.businessType}
                                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ex: Clínica Odontológica"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">🤖 Inteligência Artificial</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Provedor</label>
                                <select
                                    value={formData.aiProvider}
                                    onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value, aiModel: getDefaultModel(e.target.value) })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openrouter">OpenRouter (Grok, Claude, etc)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Modelo</label>
                                <select
                                    value={formData.aiModel}
                                    onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {getAvailableModels(formData.aiProvider).map((model: { id: string, name: string }) => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-gray-400">ID da Voz (ElevenLabs) - Opcional</label>
                                <input
                                    type="text"
                                    value={formData.voiceId || ""}
                                    onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ex: 21m00Tcm4TlvDq8ikWAM"
                                />
                                <p className="text-[10px] text-gray-500">Se preenchido e a chave global da ElevenLabs estiver configurada, os áudios do bot usarão esta voz.</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500">
                            Certifique-se de ter configurado a chave de API correspondente em Configurações `{'>'}` Inteligência Artificial.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Descrição do Negócio (Contexto)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                            placeholder="Descreva o que a empresa faz, produtos, diferenciais..."
                        />
                        <p className="text-xs text-gray-500">Essa descrição é usada para gerar o comportamento do bot.</p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setShowPrompt(!showPrompt)}
                            className="text-indigo-400 text-sm hover:underline flex items-center gap-1 mb-2"
                        >
                            {showPrompt ? 'Ocultar' : 'Mostrar'} Cérebro do Bot (System Prompt)
                        </button>

                        {showPrompt && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-2">
                                    <p className="text-yellow-200 text-xs">
                                        ⚠️ <strong>Cuidado:</strong> Alterar o System Prompt pode quebrar a personalidade do bot. Só edite se souber o que está fazendo.
                                    </p>
                                </div>
                                <textarea
                                    value={formData.systemPrompt}
                                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[250px]"
                                    placeholder="Instruções do sistema..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">🔗 Webhook Externo (Chatwoot / n8n / Make)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">URL do Webhook</label>
                                <input
                                    type="url"
                                    value={formData.webhookUrl}
                                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://sua-url.com/webhook"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Token de Autenticação</label>
                                <input
                                    type="text"
                                    value={formData.webhookToken}
                                    onChange={(e) => setFormData({ ...formData, webhookToken: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Seu token de acesso"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Se preenchido, o agente enviará notificações para esta URL após processar mensagens.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">💬 Integração Chatwoot</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">URL do Chatwoot</label>
                                <input
                                    type="url"
                                    value={formData.chatwootUrl}
                                    onChange={(e) => setFormData({ ...formData, chatwootUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://chatwoot.seu-dominio.com"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">Token de Acesso (API Key)</label>
                                    <input
                                        type="text"
                                        value={formData.chatwootToken}
                                        onChange={(e) => setFormData({ ...formData, chatwootToken: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Token da conta"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400">ID da Conta</label>
                                    <input
                                        type="text"
                                        value={formData.chatwootAccountId}
                                        onChange={(e) => setFormData({ ...formData, chatwootAccountId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: 1"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            O bot usará estas credenciais para buscar informações do usuário e sincronizar conversas.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 transition-colors"
                        >
                            <Save size={18} />
                            Salvar Alterações
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
