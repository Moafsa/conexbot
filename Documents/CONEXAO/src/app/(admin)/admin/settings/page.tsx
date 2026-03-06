'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, ShieldCheck, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        asaasApiKey: '',
        openaiApiKey: '',
        geminiApiKey: '',
        elevenLabsApiKey: '',
        googleClientId: '',
        googleClientSecret: '',
        systemName: 'ConextBot',
        maintenanceMode: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetch('/api/admin/config')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setSettings({
                        asaasApiKey: data.asaasApiKey || '',
                        openaiApiKey: data.openaiApiKey || '',
                        geminiApiKey: data.geminiApiKey || '',
                        elevenLabsApiKey: data.elevenLabsApiKey || '',
                        googleClientId: data.googleClientId || '',
                        googleClientSecret: data.googleClientSecret || '',
                        systemName: data.systemName || 'ConextBot',
                        maintenanceMode: data.maintenanceMode || false
                    });
                }
            })
            .catch(err => console.error('Failed to load settings', err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
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

    if (loading) {
        return <div className="p-8 text-gray-400 animate-pulse font-medium italic">Carregando configurações...</div>;
    }

    return (
        <div className="max-w-4xl animate-in fade-in duration-700 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Configurações Gerais</h1>
                <p className="text-gray-400 mt-2">Gerencie chaves de API, Google Auth e parâmetros globais do sistema.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <div className="pt-6 border-t border-[#1a1a1a]">
                                <h3 className="text-xl font-bold flex items-center space-x-2 mb-6">
                                    <Globe size={20} className="text-emerald-400" />
                                    <span>Parâmetros do Sistema</span>
                                </h3>

                                <div className="space-y-4">
                                    <SettingInput
                                        label="Nome da Plataforma"
                                        value={settings.systemName}
                                        onChange={v => setSettings({ ...settings, systemName: v })}
                                    />

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

                            {message.text && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
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

function SettingInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-inter"
            />
        </div>
    );
}
