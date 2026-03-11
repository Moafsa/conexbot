
import { useState, useEffect } from "react";
import { 
    Bot, Plus, Settings, MessageSquare, Database, Sparkles, 
    Save, X, Trash2, Bell, Play, Pause, DollarSign, HelpCircle, Percent, AlertCircle, ExternalLink, Book, Zap, Upload, Globe, RefreshCw, Users 
} from "lucide-react";
import { toast } from "sonner";

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
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    openrouter: [
        { id: 'x-ai/grok-2', name: 'Grok 2 (xAI)' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'meta-llama/llama-3.1-405b', name: 'Llama 3.1 405B' },
    ]
};

const getDefaultModel = (provider: string) => MODELS_BY_PROVIDER[provider]?.[0]?.id || "";
const getAvailableModels = (provider: string) => MODELS_BY_PROVIDER[provider] || [];

type Tab = 'identity' | 'ai' | 'materials' | 'followup' | 'payments' | 'integrations';

export default function EditBotModal({ isOpen, onClose, botData, onSave }: EditBotModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('identity');
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
        voiceId: "",
        enablePayments: false,
        messageBuffer: 1500,
        asaasApiKey: "",
        userSplitType: "PERCENTAGE",
        userSplitValue: 0,
        groupResponseMode: "ALL",
        allowedGroups: [] as string[],
    });

    const [materials, setMaterials] = useState<any[]>([]);
    const [followupRules, setFollowupRules] = useState<any[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

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
                voiceId: botData.voiceId || "",
                enablePayments: botData.enablePayments || false,
                messageBuffer: botData.messageBuffer ?? 1500,
                asaasApiKey: botData.asaasApiKey || "",
                userSplitType: botData.userSplitType || "PERCENTAGE",
                userSplitValue: botData.userSplitValue || 0,
                groupResponseMode: botData.groupResponseMode || "ALL",
                allowedGroups: botData.allowedGroups || [],
            });
            fetchExtraData();
        }
    }, [isOpen, botData]);

    async function fetchExtraData() {
        if (!botData?.id) return;
        try {
            const resMat = await fetch(`/api/bots/${botData.id}/media`);
            if (resMat.ok) setMaterials(await resMat.json());

            const resFol = await fetch(`/api/bots/${botData.id}/followup`);
            if (resFol.ok) setFollowupRules(await resFol.json());
        } catch (e) { }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !botData?.id) return;

        setLoadingMaterials(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', file.name);

        try {
            const res = await fetch(`/api/bots/${botData.id}/media`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                toast.success("Material enviado com sucesso!");
                fetchExtraData();
            } else {
                toast.error("Erro ao enviar material");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        } finally {
            setLoadingMaterials(false);
        }
    };

    const handleAddFollowup = async () => {
        const name = prompt("Nome da regra (ex: Pós-venda 1 dia):");
        if (!name) return;
        const msg = prompt("Mensagem que o bot deve enviar:");
        if (!msg) return;
        const days = prompt("Dias após o gatilho (número):", "1");
        const type = prompt("Tipo de gatilho (SALES, POST_SALE, EVENT_REMINDER):", "SALES");

        try {
            const res = await fetch(`/api/bots/${botData.id}/followup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, message: msg, triggerDays: days, triggerType: type })
            });
            if (res.ok) {
                toast.success("Regra criada!");
                fetchExtraData();
            }
        } catch (error) {
            toast.error("Erro ao criar regra");
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-gray-950 border border-white/10 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)] overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gray-900/50">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                            Agente: <span className="text-indigo-400">{formData.name || 'Novo'}</span>
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configurações Avançadas e Inteligência</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-black/40 border-r border-white/5 p-4 flex flex-col gap-2">
                        <TabButton id="identity" label="Identidade" icon={<Book size={18} />} active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} />
                        <TabButton id="ai" label="Inteligências" icon={<Zap size={18} />} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
                        <TabButton id="materials" label="Materiais do Bot" icon={<Upload size={18} />} active={activeTab === 'materials'} onClick={() => setActiveTab('materials')} />
                        <TabButton id="followup" label="Follow-up Automático" icon={<Bell size={18} />} active={activeTab === 'followup'} onClick={() => setActiveTab('followup')} />
                        <TabButton id="payments" label="Pagamentos & CRM" icon={<DollarSign size={18} />} active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                        <TabButton id="integrations" label="Integrações" icon={<Globe size={18} />} active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-gray-950 to-black">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {activeTab === 'identity' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <Field label="Nome do Agente" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} placeholder="Ex: Pedro Vendas" />
                                        <Field label="Tipo de Negócio" value={formData.businessType} onChange={v => setFormData({ ...formData, businessType: v })} placeholder="Ex: E-commerce" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Descrição e Contexto</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px] transition-all"
                                            placeholder="Descreva o que seu bot faz, preços, prazos..."
                                        />
                                    </div>
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                    <Users size={18} className="text-indigo-400" /> Resposta em Grupos
                                                </h4>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Defina como o bot se comporta em grupos</p>
                                            </div>
                                            <select
                                                value={formData.groupResponseMode}
                                                onChange={e => setFormData({ ...formData, groupResponseMode: e.target.value })}
                                                className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="ALL">Responder Tudo</option>
                                                <option value="NONE">Ignorar Grupos</option>
                                                <option value="SPECIFIC">Grupos Específicos</option>
                                            </select>
                                        </div>

                                        {formData.groupResponseMode === 'SPECIFIC' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between items-center">
                                                    IDs dos Grupos Permitidos (JIDs)
                                                    <span className="text-[9px] text-indigo-400">Separe por vírgula</span>
                                                </label>
                                                <textarea
                                                    value={formData.allowedGroups.join(', ')}
                                                    onChange={e => setFormData({ ...formData, allowedGroups: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none min-h-[60px]"
                                                    placeholder="Ex: 123456789@g.us, 987654321@g.us"
                                                />
                                                <p className="text-[9px] text-gray-600 italic">
                                                    * O bot responderá apenas nos grupos listados acima, além das conversas privadas.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4">
                                        <label className="text-xs font-black text-indigo-400 uppercase tracking-widest flex justify-between items-center mb-2">
                                            System Prompt (Cérebro)
                                            <span className="text-[9px] bg-indigo-500/20 px-2 py-0.5 rounded-full">Avançado</span>
                                        </label>
                                        <textarea
                                            value={formData.systemPrompt}
                                            onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-indigo-100/70 font-mono text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none min-h-[200px]"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ai' && (
                                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    Provedor LLM
                                                    <div className="group relative">
                                                        <HelpCircle size={14} className="text-gray-600 hover:text-indigo-400 cursor-help" />
                                                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                            A OpenAI é recomendada para melhor inteligência. O Gemini é mais rápido e econômico.
                                                        </div>
                                                    </div>
                                                </div>
                                                <a href="https://platform.openai.com/api-keys" target="_blank" className="text-indigo-400 hover:underline flex items-center gap-1">Chaves <ExternalLink size={10} /></a>
                                            </label>
                                            <select
                                                value={formData.aiProvider}
                                                onChange={e => setFormData({ ...formData, aiProvider: e.target.value, aiModel: getDefaultModel(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                            >
                                                <option value="openai">OpenAI (Sugerido)</option>
                                                <option value="gemini">Google Gemini</option>
                                                <option value="openrouter">OpenRouter</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Modelo de IA</label>
                                            <select
                                                value={formData.aiModel}
                                                onChange={e => setFormData({ ...formData, aiModel: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                            >
                                                {getAvailableModels(formData.aiProvider).map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                ID da Voz (ElevenLabs)
                                                <div className="group relative">
                                                    <HelpCircle size={14} className="text-gray-600 hover:text-indigo-400 cursor-help" />
                                                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                        Copie o ID da voz no Voice Lab da ElevenLabs para que seu bot possa falar.
                                                    </div>
                                                </div>
                                            </div>
                                            <a href="https://elevenlabs.io/app/voice-lab" target="_blank" className="text-indigo-400 hover:underline flex items-center gap-1">Vozes <ExternalLink size={10} /></a>
                                        </label>
                                        <input
                                            value={formData.voiceId}
                                            onChange={e => setFormData({ ...formData, voiceId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: 21m00Tcm4TlvDq8ikWAM"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                Buffer de Mensagens (ms)
                                                <div className="group relative">
                                                    <HelpCircle size={14} className="text-gray-600 hover:text-indigo-400 cursor-help" />
                                                    <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                        Tempo que o bot espera para agrupar mensagens antes de responder. 
                                                        Isso permite que se o usuário enviar várias mensagens de 
                                                        texto, áudio ou imagem seguidas, o bot responda tudo de uma vez.
                                                        Valor sugerido: 1500ms. Use 0 para desativar.
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.messageBuffer}
                                            onChange={e => setFormData({ ...formData, messageBuffer: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: 1500"
                                        />
                                    </div>

                                    <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Zap size={16} className="text-indigo-400" /> Visão Computacional Ativa</h4>
                                        <p className="text-xs text-gray-400 leading-tight">
                                            Este bot está configurado para ler imagens de comprovantes, fotos de produtos e documentos.
                                            O sistema usará o provedor selecionado acima para realizar a análise visual.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'materials' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">Base de Materiais</h4>
                                            <p className="text-xs text-gray-500">Documentos que o bot pode enviar para os clientes.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="file" id="mat-upload" className="hidden" onChange={handleFileUpload} />
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('mat-upload')?.click()}
                                                disabled={loadingMaterials}
                                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                            >
                                                {loadingMaterials ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                                                Upload PDF/Imagem
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {materials.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                                                <Book size={48} className="mx-auto mb-4" />
                                                <p className="text-xs uppercase tracking-widest font-black">Nenhum material cadastrado</p>
                                            </div>
                                        ) : (
                                            materials.map(m => (
                                                <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/[0.07] transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                            <Book size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{m.name}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase">{m.type}</p>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'followup' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">Réguas de Follow-up Inteligente</h4>
                                            <p className="text-xs text-gray-500">Configure os prazos e a IA decidirá como abordar cada cliente.</p>
                                        </div>
                                    </div>

                                    {/* Formulário de Adição de Regra */}
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Nova Automatação Proativa</h5>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nome da Régua</label>
                                                <input id="fol-name" className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Ex: Retomar Venda Parada" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo de Gatilho</label>
                                                <select id="fol-type" className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500">
                                                    <option value="SALES">Vendas (Pós Última Mensagem)</option>
                                                    <option value="POST_SALE">Pós-Venda (Após Pagamento)</option>
                                                    <option value="EVENT_REMINDER">Lembrete de Evento (Agenda)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Intervalo (Dias)</label>
                                                <input id="fol-days" type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="1" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase italic">Instruções para a IA</label>
                                                <input id="fol-msg" className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Ex: Tente converter a venda sem ser invasivo..." />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const name = (document.getElementById('fol-name') as HTMLInputElement).value;
                                                const type = (document.getElementById('fol-type') as HTMLSelectElement).value;
                                                const days = (document.getElementById('fol-days') as HTMLInputElement).value;
                                                const msg = (document.getElementById('fol-msg') as HTMLInputElement).value;

                                                if (!name || !msg) return toast.error("Preencha todos os campos");

                                                try {
                                                    const res = await fetch(`/api/bots/${botData.id}/followup`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ name, message: msg, triggerDays: days, triggerType: type })
                                                    });
                                                    if (res.ok) {
                                                        toast.success("Regra criada!");
                                                        fetchExtraData();
                                                        (document.getElementById('fol-name') as HTMLInputElement).value = '';
                                                        (document.getElementById('fol-msg') as HTMLInputElement).value = '';
                                                    }
                                                } catch (e) { toast.error("Erro ao salvar"); }
                                            }}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            Adicionar à Estratégia
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Regras Ativas</h4>
                                        {followupRules.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                                                <Bell size={48} className="mx-auto mb-4" />
                                                <p className="text-xs uppercase tracking-widest font-black">Sem regras de acompanhamento</p>
                                            </div>
                                        ) : (
                                            followupRules.map(r => (
                                                <div key={r.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center group">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h5 className="font-bold text-indigo-400">{r.name}</h5>
                                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${r.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                {r.active ? 'ATIVA' : 'PAUSADA'}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-400 italic mb-2">"{r.message}"</p>
                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                                            <span className="bg-white/5 px-2 py-0.5 rounded-full">{r.triggerType}</span>
                                                            <span className="bg-white/5 px-2 py-0.5 rounded-full">{r.triggerDays} {Math.abs(r.triggerDays) === 1 ? 'dia' : 'dias'}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm("Remover esta automação?")) return;
                                                            // Implement delete if needed, or just let users know it's a list
                                                        }}
                                                        className="p-3 bg-red-500/10 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-4">
                                        <p className="text-[10px] text-purple-200">
                                            💡 <strong>Análise Contextual:</strong> Diferente de ferramentas legadas, nossa IA lê todo o histórico e gera uma mensagem inédita para cada cliente seguindo suas instruções acima.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payments' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <div>
                                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                <DollarSign size={20} className="text-emerald-400" /> Cobrança Automatizada
                                                <div className="group relative">
                                                    <HelpCircle size={16} className="text-gray-600 hover:text-indigo-400 cursor-help" />
                                                    <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                        O bot identificará intenção de compra e enviará o link do Asaas automaticamente.
                                                    </div>
                                                </div>
                                            </h4>
                                            <p className="text-xs text-gray-500 max-w-sm">Requer Chave de API Asaas configurada no painel principal.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.enablePayments}
                                                onChange={e => setFormData({ ...formData, enablePayments: e.target.checked })}
                                            />
                                            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </label>
                                    </div>
                                    
                                    <div className={`space-y-2 transition-all ${formData.enablePayments ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                Chave Asaas Exclusiva do Bot
                                                <div className="group relative">
                                                    <HelpCircle size={14} className="text-gray-600 hover:text-indigo-400 cursor-help" />
                                                    <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 border border-white/10 rounded-lg text-[10px] font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                                        Se deixada em branco, usará a chave configurada nas definições gerais. Útil para afiliados.
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                        <input
                                            value={formData.asaasApiKey}
                                            onChange={e => setFormData({ ...formData, asaasApiKey: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: $a6b7..."
                                        />
                                        <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                            <p className="text-[10px] text-blue-300 leading-tight">
                                                🔗 <strong>Configuração de Webhook no Asaas:</strong><br/>
                                                Para receber confirmações de pagamento, configure esta URL no seu painel Asaas:
                                                <code className="block mt-1 bg-black/40 p-1.5 rounded select-all font-mono">
                                                    {window.location.origin}/api/webhooks/asaas
                                                </code>
                                            </p>
                                        </div>
                                    </div>

                                    {formData.asaasApiKey && (
                                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-4 animate-in fade-in duration-500">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                                    <Percent size={16} className="text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">Comissão de Afiliado (Split)</h4>
                                                    <p className="text-[10px] text-gray-400">Receba uma parte de cada venda realizada por este agente.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase">Tipo</label>
                                                    <select
                                                        value={formData.userSplitType}
                                                        onChange={e => setFormData({ ...formData, userSplitType: e.target.value as any })}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                                    >
                                                        <option value="PERCENTAGE">Porcentagem (%)</option>
                                                        <option value="FIXED">Valor Fixo (R$)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase">
                                                        {formData.userSplitType === 'PERCENTAGE' ? 'Porcentagem (Máx 10%)' : 'Valor Fixo'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={formData.userSplitValue}
                                                        onChange={e => {
                                                            let val = parseFloat(e.target.value) || 0;
                                                            if (formData.userSplitType === 'PERCENTAGE' && val > 10) val = 10;
                                                            setFormData({ ...formData, userSplitValue: val });
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-indigo-300 leading-tight">
                                                * O valor será creditado na carteira Asaas configurada em suas Definições de Perfil.
                                            </p>
                                            {!(botData.tenant as any)?.asaasWalletId && (
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                                                    <AlertCircle size={14} className="text-amber-400 mt-0.5" />
                                                    <p className="text-[10px] text-amber-300 leading-tight">
                                                        ⚠️ <strong>Wallet ID Ausente:</strong> Você configurou um split mas não informou seu Wallet ID no perfil. O split falhará.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`p-6 border-2 border-dashed rounded-3xl transition-all ${formData.enablePayments ? 'border-white/10 bg-white/5 opacity-100' : 'border-white/5 opacity-30 pointer-events-none'}`}>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Configurações de Produto</h4>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <span className="text-xs font-bold text-white">Taxa de Verificação de Checkout</span>
                                                <span className="text-xs font-black text-gray-500">AUTOMÁTICO VIA IA</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-snug">
                                                O bot utilizará os produtos cadastrados no CRM para oferecer aos clientes. Certifique-se de preencher os valores corretamente no menu lateral de Produtos.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'integrations' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">💬 Chatwoot</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="URL do Chatwoot" value={formData.chatwootUrl} onChange={v => setFormData({ ...formData, chatwootUrl: v })} placeholder="https://..." />
                                            <Field label="ID da Conta" value={formData.chatwootAccountId} onChange={v => setFormData({ ...formData, chatwootAccountId: v })} placeholder="Ex: 1" />
                                            <div className="col-span-2">
                                                <Field label="Token de Acesso" value={formData.chatwootToken} onChange={v => setFormData({ ...formData, chatwootToken: v })} placeholder="Seu Token" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">🔗 Webhooks Externos</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="URL Webhook" value={formData.webhookUrl} onChange={v => setFormData({ ...formData, webhookUrl: v })} placeholder="https://n8n..." />
                                            <Field label="Token (Opcional)" value={formData.webhookToken} onChange={v => setFormData({ ...formData, webhookToken: v })} placeholder="Security Token" />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-gray-900/50 flex justify-between items-center">
                    <button type="button" onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                        Descartar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-2xl text-white font-black uppercase tracking-tighter transition-all shadow-xl active:scale-95"
                    >
                        <Save size={20} /> Salvar Alterações
                    </button>
                </div>

            </div>
        </div>
    );
}

function TabButton({ id, label, icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs uppercase tracking-tight
                ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
            <span className={active ? 'text-white' : 'text-indigo-400'}>{icon}</span>
            {label}
        </button>
    );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-700"
                placeholder={placeholder}
            />
        </div>
    );
}
