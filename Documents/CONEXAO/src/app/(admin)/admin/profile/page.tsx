'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function AdminProfilePage() {
    const { data: session, update } = useSession();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchUserData = async () => {
            if ((session?.user as any)?.id) {
                try {
                    const res = await fetch(`/api/admin/users/${(session?.user as any).id}`);
                    if (res.ok) {
                        const userData = await res.json();
                        setFormData(prev => ({
                            ...prev,
                            name: userData.name || '',
                            email: userData.email || ''
                        }));
                    }
                } catch (error) {
                    console.error('Failed to fetch user data');
                }
            }
        };
        fetchUserData();
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`/api/admin/users/${(session?.user as any)?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    ...(formData.password && { password: formData.password })
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
                await update();
            } else {
                throw new Error('Falha ao atualizar');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Ocorreu um erro ao atualizar o perfil' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl animate-in fade-in duration-700">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Meu Perfil</h1>
                <p className="text-gray-400 mt-2">Gerencie suas credenciais de acesso Superadmin.</p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center space-x-2">
                            <User size={16} />
                            <span>Nome Completo</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-inter"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center space-x-2">
                            <Mail size={16} />
                            <span>E-mail</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-inter"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1a1a1a]">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center space-x-2">
                                <Lock size={16} />
                                <span>Nova Senha (opcional)</span>
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-inter"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center space-x-2">
                                <Shield size={16} />
                                <span>Confirmar Senha</span>
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full bg-[#151515] border border-[#222] rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-inter"
                            />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                        >
                            <Save size={20} />
                            <span>{loading ? 'Salvando...' : 'Atualizar Perfil'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
