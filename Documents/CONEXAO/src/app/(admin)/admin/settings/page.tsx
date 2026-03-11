'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, ShieldCheck, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        asaasApiKey: '',
        asaasWalletId: '',
        stripeSecretKey: '',
        stripePublishableKey: '',
        mercadoPagoAccessToken: '',
        openaiApiKey: '',
        geminiApiKey: '',
        elevenLabsApiKey: '',
        googleClientId: '',
        googleClientSecret: '',
        systemName: 'ConextBot',
        maintenanceMode: false,
        logoColoredUrl: '',
        logoWhiteUrl: '',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpFrom: '',
        systemBotId: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({ colored: false, white: false });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [systemBot, setSystemBot] = useState<{ status: string, botName?: string, botId?: string } | null>(null);

    useEffect(() => {
        fetch('/api/admin/config')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setSettings({
                        ...settings,
                        ...data
                    });
                }
            })
            .catch(err => console.error('Failed to load settings', err))
            .finally(() => setLoading(false));

        fetch('/api/admin/system-bot')
            .then(res => res.json())
            .then(data => setSystemBot(data))
            .catch(console.error);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/admin/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error("Erro ao salvar");
            setMessage({ type: 'success', text: 'Configurações globais salvas com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Falha ao salvar configurações' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (type: 'colored' | 'white', file: File) => {
        setUploading(prev => ({ ...prev, [type]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const res = await fetch('/api/admin/config/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Falha no upload");
            
            const data = await res.json();
            setSettings(prev => ({ 
                ...prev, 
                ...data
            }));
            setMessage({ type: 'success', text: `Logo ${type === 'colored' ? 'colorida' : 'branca'} enviada!` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao fazer upload da logo' });
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-400 animate-pulse font-medium italic">Carregando configurações...</div>;
    }

    const handleConnectSystemBot = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/system-bot", { method: "POST" });
            const data = await res.json();
            if (data.botId) {
                window.location.assign(`/dashboard/connect?botId=${data.botId}`);
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao iniciar conexão." });
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnectSystemBot = async () => {
        if (!confirm("Tem certeza que deseja desconectar o WhatsApp do sistema?")) return;
        setSaving(true);
        try {
            await fetch("/api/admin/system-bot", { method: "DELETE" });
            const systemBotRes = await fetch("/api/admin/system-bot");
            if (systemBotRes.ok) {
                const data = await systemBotRes.json();
                setSystemBot(data);
            }
            setMessage({ type: 'success', text: "WhatsApp desconectado com sucesso." });
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao desconectar." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl animate-in fade-in duration-700 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Configurações Gerais</h1>
                <p className="text-gray-400 mt-2">Gerencie chaves de API, Google Auth e parâmetros globais do sistema.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center space-x-2">
                                <ShieldCheck size={20} className="text-blue-400" />
                                <span>Google Autenticação (Social Login)</span>
                            </h3>

                            <div className="space-y-4">
                                <SettingInput
                                    label="Google Client ID"
                                    value={settings.googleClientId}
                                    onChange={v => setSettings({ ...settings, googleClientId: v })}
                                    placeholder="...content.googleusercontent.com"
                                />
                                <SettingInput
                                    label="Google Client Secret"
                                    value={settings.googleClientSecret}
                                    onChange={v => setSettings({ ...settings, googleClientSecret: v })}
                                    placeholder="GOCSPX-..."
                                />
                            </div>

                            <h3 className="text-xl font-bold flex items-center space-x-2 pt-6">
                                <Key size={20} className="text-purple-400" />
                                <span>Chaves de API Global (Fallback)</span>
                            </h3>

                            <div className="space-y-4">
                                <SettingInput
                                    label="ASAAS API Key (Produção)"
                                    value={settings.asaasApiKey}
                                    onChange={v => setSettings({ ...settings, asaasApiKey: v })}
                                    placeholder="sk_..."
                                />
                                <SettingInput
                                    label="ASAAS Wallet ID (Plataforma)"
                                    value={settings.asaasWalletId}
                                    onChange={v => setSettings({ ...settings, asaasWalletId: v })}
                                    placeholder="Ex: 50a..."
                                />
                                <div className="border-t border-[#1a1a1a] my-4 pt-4">
                                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Stripe</h4>
                                    <SettingInput
                                        label="Stripe Publishable Key"
                                        value={settings.stripePublishableKey}
                                        onChange={v => setSettings({ ...settings, stripePublishableKey: v })}
                                        placeholder="pk_test_..."
                                    />
                                    <div className="mt-4">
                                        <SettingInput
                                            label="Stripe Secret Key"
                                            value={settings.stripeSecretKey}
                                            onChange={v => setSettings({ ...settings, stripeSecretKey: v })}
                                            placeholder="sk_test_..."
                                        />
                                    </div>
                                </div>
                                <div className="border-t border-[#1a1a1a] my-4 pt-4">
                                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Mercado Pago</h4>
                                    <SettingInput
                                        label="Access Token"
                                        value={settings.mercadoPagoAccessToken}
                                        onChange={v => setSettings({ ...settings, mercadoPagoAccessToken: v })}
                                        placeholder="APP_USR-..."
                                    />
                                </div>
                                <div className="border-t border-[#1a1a1a] my-4 pt-4">
                                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Inteligência Artificial</h4>
                                    <SettingInput
                                        label="OpenAI API Key"
                                        value={settings.openaiApiKey}
                                        onChange={v => setSettings({ ...settings, openaiApiKey: v })}
                                        placeholder="sk-..."
                                    />
                                    <SettingInput
                                        label="Google Gemini Key"
                                        value={settings.geminiApiKey}
                                        onChange={v => setSettings({ ...settings, geminiApiKey: v })}
                                        placeholder="AIza..."
                                    />
                                    <SettingInput
                                        label="ElevenLabs Key"
                                        value={settings.elevenLabsApiKey}
                                        onChange={v => setSettings({ ...settings, elevenLabsApiKey: v })}
                                        placeholder="sk_..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#1a1a1a]">
                                <h3 className="text-xl font-bold flex items-center space-x-2 mb-6">
                                    <Globe size={20} className="text-emerald-400" />
                                    <span>Parâmetros do Sistema</span>
                                </h3>

                                <div className="space-y-6">
                                    <SettingInput
                                        label="Nome da Plataforma"
                                        value={settings.systemName}
                                        onChange={v => setSettings({ ...settings, systemName: v })}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <LogoUploadSection
                                            label="Logo Colorida (Favicon)"
                                            value={settings.logoColoredUrl}
                                            onChange={v => setSettings({ ...settings, logoColoredUrl: v })}
                                            onUpload={file => handleUpload('colored', file)}
                                            uploading={uploading.colored}
                                            placeholder="https://..."
                                            helperText="Usada como favicon e em temas claros."
                                        />
                                        <LogoUploadSection
                                            label="Logo Branca (Dark Mode)"
                                            value={settings.logoWhiteUrl}
                                            onChange={v => setSettings({ ...settings, logoWhiteUrl: v })}
                                            onUpload={file => handleUpload('white', file)}
                                            uploading={uploading.white}
                                            placeholder="https://..."
                                            helperText="Usada no topo da Landing Page e menus escuros."
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-[#151515] rounded-xl border border-[#222]">
                                        <div className="space-y-1">
                                            <div className="font-medium text-sm">Modo Manutenção</div>
                                            <div className="text-[10px] text-gray-500">Bloqueia o acesso de todos os usuários menos Superadmins.</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#1a1a1a]">
                                <h3 className="text-xl font-bold flex items-center space-x-2 mb-6">
                                    <ShieldCheck size={20} className="text-purple-400" />
                                    <span>SMTP Global (Alertas)</span>
                                </h3>
                                <div className="space-y-4">
                                    <SettingInput label="Host SMTP" value={settings.smtpHost} onChange={v => setSettings({ ...settings, smtpHost: v })} placeholder="smtp.gmail.com" />
                                    <SettingInput label="Porta" value={settings.smtpPort?.toString()} onChange={v => setSettings({ ...settings, smtpPort: parseInt(v) })} placeholder="587" />
                                    <SettingInput label="Usuário" value={settings.smtpUser} onChange={v => setSettings({ ...settings, smtpUser: v })} />
                                    <SettingInput label="Senha" value={settings.smtpPass} onChange={v => setSettings({ ...settings, smtpPass: v })} />
                                    <SettingInput label="E-mail Remetente" value={settings.smtpFrom} onChange={v => setSettings({ ...settings, smtpFrom: v })} placeholder="alertas@conexbot.com" />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#1a1a1a]">
                                <h3 className="text-xl font-bold flex items-center space-x-2 mb-6">
                                    <Globe size={20} className="text-green-400" />
                                    <span>WhatsApp do Sistema (Global)</span>
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400 leading-relaxed">Este é o WhatsApp oficial que enviará alertas de cobrança e suporte para o ecossistema.</p>
                                    
                                    <div className="p-4 rounded-xl bg-[#151515] border border-[#222] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full animate-pulse ${systemBot?.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div>
                                                <p className="text-sm font-bold">{systemBot?.botName || "Sistema - Avisos"}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status: {systemBot?.status || 'DESCONECTADO'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={handleConnectSystemBot} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">
                                                {systemBot?.status === 'CONNECTED' ? 'Reconectar' : 'Conectar Agora'}
                                            </button>
                                            {systemBot?.status === 'CONNECTED' && (
                                                <button type="button" onClick={handleDisconnectSystemBot} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-colors">
                                                    Desconectar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {message.text && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                <Save size={20} />
                                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <div className="flex items-center space-x-2 text-blue-400 mb-4 font-bold">
                            <ShieldCheck size={20} />
                            <span>Segurança</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Estas configurações afetam toda a plataforma. As chaves de API fornecidas aqui serão usadas como "fallback" caso um usuário não configure a dele própria.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LogoUploadSection({ 
    label, 
    value, 
    onChange, 
    onUpload, 
    uploading, 
    placeholder,
    helperText
}: { 
    label: string, 
    value: string | null, 
    onChange: (v: string) => void, 
    onUpload: (file: File) => void,
    uploading: boolean,
    placeholder?: string,
    helperText?: string
}) {
    const inputValue = value || "";
    return (
        <div className="space-y-4">
            <label className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                <Globe size={14} className="text-blue-500" />
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-[#151515] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-inter text-sm"
                />
                <label className={`cursor-pointer group relative overflow-hidden flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all ${uploading ? 'opacity-50' : ''}`}>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        disabled={uploading}
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(file);
                        }}
                    />
                    {uploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={20} className="text-gray-400 group-hover:text-white transition-colors rotate-180" />
                    )}
                </label>
            </div>
            {value && (
                <div className="relative w-full h-12 bg-black/20 rounded-lg p-1 border border-white/5 flex items-center gap-2 overflow-hidden">
                    <img src={value} className="h-full w-auto object-contain rounded" alt="Preview"/>
                    <span className="text-[10px] text-gray-600 truncate flex-1">{value}</span>
                </div>
            )}
            {helperText && <p className="text-[10px] text-gray-600 italic">{helperText}</p>}
        </div>
    );
}

function SettingInput({ label, value, onChange, placeholder }: { label: string; value: string | null; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">{label}</label>
            <input
                type="text"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-inter"
            />
        </div>
    );
}
