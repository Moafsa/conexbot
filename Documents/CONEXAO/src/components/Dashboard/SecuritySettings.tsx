"use client";

import { useState } from "react";
import { Shield, Clock, Bell, Save, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SecuritySettingsProps {
    bot: any;
    onUpdate: () => void;
}

export function SecuritySettings({ bot, onUpdate }: SecuritySettingsProps) {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        enableAiDetection: bot.enableAiDetection || false,
        aiDetectionAction: bot.aiDetectionAction || "PAUSE",
        humanTakeoverPause: bot.humanTakeoverPause || 30,
        handoffPause: bot.handoffPause || 1440,
        notifyChannels: bot.notifyChannels || "INTERNAL,WHATSAPP,EMAIL"
    });

    async function handleSave() {
        setLoading(true);
        try {
            const res = await fetch(`/api/bots/${bot.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                toast.success("Configurações de segurança atualizadas!");
                onUpdate();
            } else {
                const data = await res.json();
                toast.error(data.error || "Erro ao salvar");
            }
        } catch (error) {
            toast.error("Erro na conexão");
        } finally {
            setLoading(false);
        }
    }

    const channels = config.notifyChannels.split(",");

    const toggleChannel = (channel: string) => {
        let newChannels: string[];
        if (channels.includes(channel)) {
            newChannels = channels.filter((c: string) => c !== channel);
        } else {
            newChannels = [...channels, channel];
        }
        setConfig({ ...config, notifyChannels: newChannels.join(",") });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* AI Detection */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Shield size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800">Detecção de IA</h3>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-sm font-bold text-gray-700">Ativar Detecção</p>
                            <p className="text-xs text-gray-500">Identificar se o contato é outro bot.</p>
                        </div>
                        <button 
                            onClick={() => setConfig({...config, enableAiDetection: !config.enableAiDetection})}
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.enableAiDetection ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.enableAiDetection ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {config.enableAiDetection && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Ação ao detectar</label>
                            <select 
                                value={config.aiDetectionAction}
                                onChange={e => setConfig({...config, aiDetectionAction: e.target.value})}
                                className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="PAUSE">Pausar Conversa (Recomendado)</option>
                                <option value="BLOCK">Bloquear Contato</option>
                                <option value="NOTIFY">Apenas Notificar</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Pauses */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800">Tempos de Pausa</h3>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Human Takeover (Minutos)</label>
                        <p className="text-[10px] text-gray-400 mb-2">Tempo que o bot silencia após você enviar uma mensagem manual.</p>
                        <input 
                            type="number"
                            value={config.humanTakeoverPause}
                            onChange={e => setConfig({...config, humanTakeoverPause: parseInt(e.target.value)})}
                            className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Handoff Humano (Minutos)</label>
                        <p className="text-[10px] text-gray-400 mb-2">Tempo que o bot silencia após a ferramenta "chamar_humano" ser acionada.</p>
                        <input 
                            type="number"
                            value={config.handoffPause}
                            onChange={e => setConfig({...config, handoffPause: parseInt(e.target.value)})}
                            className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <p className="text-[10px] text-gray-400">Default: 1440 min (24 horas).</p>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Bell size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800">Canais de Notificação</h3>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        Selecione onde você deseja receber alertas de segurança e solicitações de ajuda.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { id: "INTERNAL", label: "Sininho (Painel)", description: "Alerta interno no dashboard" },
                            { id: "WHATSAPP", label: "WhatsApp do Dono", description: "Mensagem direta no seu celular" },
                            { id: "EMAIL", label: "E-mail de Cadastro", description: "Notificação na caixa de entrada" }
                        ].map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => toggleChannel(channel.id)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${channels.includes(channel.id) 
                                    ? 'border-indigo-600 bg-indigo-50/50' 
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                            >
                                <p className={`font-bold text-sm ${channels.includes(channel.id) ? 'text-indigo-700' : 'text-gray-700'}`}>
                                    {channel.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{channel.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary flex items-center gap-2 px-8 py-3 shadow-lg shadow-indigo-200"
                >
                    {loading ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
}
