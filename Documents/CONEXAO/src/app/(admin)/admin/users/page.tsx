'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, MoreHorizontal, Edit, Trash2, X, Save, Bot as BotIcon, Zap, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userBots, setUserBots] = useState<any[]>([]);
    const [loadingBots, setLoadingBots] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'bots'>('general');
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers(page, search);
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search]);

    const fetchUsers = async (currentPage = 1, searchQuery = '') => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?page=${currentPage}&search=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setUsers(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalUsers(data.total || 0);
            if (currentPage > (data.totalPages || 1)) setPage(1); // safety reset
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = async (user: any) => {
        setSelectedUser({ ...user });
        setIsEditModalOpen(true);
        setActiveTab('general');
        setLoadingBots(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/bots`);
            if (res.ok) {
                const bots = await res.json();
                setUserBots(bots);
            }
        } catch (error) {
            console.error('Error fetching user bots');
        } finally {
            setLoadingBots(false);
        }
    };

    const handleSaveUser = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: selectedUser.name,
                    email: selectedUser.email,
                    role: selectedUser.role,
                    botLimit: Number(selectedUser.botLimit),
                    openaiApiKey: selectedUser.openaiApiKey,
                    geminiApiKey: selectedUser.geminiApiKey,
                    openrouterApiKey: selectedUser.openrouterApiKey,
                    elevenLabsApiKey: selectedUser.elevenLabsApiKey,
                    asaasApiKey: selectedUser.asaasApiKey
                })
            });

            if (res.ok) {
                toast.success('Usuário atualizado com sucesso!');
                fetchUsers(page, search);
                setIsEditModalOpen(false);
            } else {
                toast.error('Erro ao salvar alterações.');
            }
        } catch (error) {
            toast.error('Falha na comunicação com o servidor.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateBot = async (botId: string, data: any) => {
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/bots`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botId, ...data })
            });

            if (res.ok) {
                toast.success('Bot atualizado!');
                // Update local list
                setUserBots(userBots.map(b => b.id === botId ? { ...b, ...data } : b));
            } else {
                toast.error('Erro ao atualizar bot.');
            }
        } catch (error) {
            toast.error('Falha na comunicação.');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir permanentemente este usuário e todos os seus dados? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Usuário excluído com sucesso!');
                fetchUsers(page, search);
            } else {
                toast.error('Erro ao excluir usuário.');
            }
        } catch (error) {
            toast.error('Falha na comunicação com o servidor.');
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        Usuários
                        <span className="bg-white/10 text-xs px-3 py-1 rounded-full text-gray-300 font-medium">
                            {totalUsers} total
                        </span>
                    </h1>
                    <p className="text-gray-400 mt-2">Gerencie todas as contas da plataforma.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por nome, email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm focus:border-blue-500 outline-none transition-all w-full md:w-64"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap">
                        Novo Usuário
                    </button>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Usuário</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Plano</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Bots</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Cadastro</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Carregando usuários...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-bold text-lg">
                                                    {user.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white group-hover:text-blue-400 transition-colors uppercase">{user.name || 'Sem nome'}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === 'SUPERADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium">{user.subscription?.plan?.name || 'FREE'}</div>
                                            <div className={`text-[10px] font-bold ${user.subscription?.status === 'ACTIVE' ? 'text-emerald-500' : 'text-gray-500'
                                                }`}>
                                                {user.subscription?.status || 'INACTIVE'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-300 font-medium">{user._count?.bots || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all" title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[#1a1a1a] flex items-center justify-between bg-[#0d0d0d]">
                        <span className="text-sm text-gray-500">
                            Mostrando página <span className="font-bold text-white">{page}</span> de <span className="font-bold text-white">{totalPages}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors text-sm"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors text-sm"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Edição Profunda */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Shield className="text-blue-500" /> Controle Total: {selectedUser.name}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">ID: {selectedUser.id}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/5 bg-[#0d0d0d]">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'general' ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                Informações Gerais
                            </button>
                            <button
                                onClick={() => setActiveTab('bots')}
                                className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'bots' ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                Gestão de Bots & Prompts
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {activeTab === 'general' ? (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</span>
                                            <input
                                                type="text"
                                                value={selectedUser.name || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail de Acesso</span>
                                            <input
                                                type="email"
                                                value={selectedUser.email || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                                            />
                                        </label>
                                        <label className="block mt-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-blue-400">OpenAI API Key</span>
                                            <input
                                                type="password"
                                                value={selectedUser.openaiApiKey || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, openaiApiKey: e.target.value })}
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                                placeholder="sk-..."
                                            />
                                        </label>
                                        <label className="block mt-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-blue-400">Gemini API Key</span>
                                            <input
                                                type="password"
                                                value={selectedUser.geminiApiKey || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, geminiApiKey: e.target.value })}
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Acesso (Role)</span>
                                            <select
                                                value={selectedUser.role}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                                className="w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                                            >
                                                <option value="USER">USUÁRIO COMUM</option>
                                                <option value="ADMIN">ADMINISTRADOR</option>
                                                <option value="SUPERADMIN">SUPER ADMIN</option>
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Limite de Bots</span>
                                            <input
                                                type="number"
                                                value={selectedUser.botLimit || 0}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, botLimit: e.target.value })}
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                                            />
                                        </label>
                                        <label className="block mt-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-pink-400">ElevenLabs Key</span>
                                            <input
                                                type="password"
                                                value={selectedUser.elevenLabsApiKey || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, elevenLabsApiKey: e.target.value })}
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                                            />
                                        </label>
                                        <label className="block mt-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-emerald-400">Asaas API Key</span>
                                            <input
                                                type="password"
                                                value={selectedUser.asaasApiKey || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, asaasApiKey: e.target.value })}
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                                placeholder="$..."
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {loadingBots ? (
                                        <div className="text-center py-10 text-gray-500">Buscando bots do cliente...</div>
                                    ) : userBots.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">Este cliente ainda não criou nenhum bot.</div>
                                    ) : (
                                        userBots.map((bot) => (
                                            <div key={bot.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                                            <BotIcon size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{bot.name}</h4>
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold">{bot.businessType} • {bot.aiModel}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${bot.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {bot.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Modelo de IA</label>
                                                        <select
                                                            defaultValue={bot.aiModel}
                                                            onChange={(e) => handleUpdateBot(bot.id, { aiModel: e.target.value })}
                                                            className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none"
                                                        >
                                                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                                                            <option value="gpt-4o">GPT-4o</option>
                                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Asaas API Key (Bot)</label>
                                                        <input
                                                            type="password"
                                                            defaultValue={bot.asaasApiKey || ''}
                                                            onBlur={(e) => handleUpdateBot(bot.id, { asaasApiKey: e.target.value })}
                                                            className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none"
                                                            placeholder="Chave específica..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                        <span>System Prompt (Instruções da IA)</span>
                                                        <Zap size={12} className="text-amber-500" />
                                                    </div>
                                                    <textarea
                                                        defaultValue={bot.systemPrompt || ''}
                                                        onBlur={(e) => handleUpdateBot(bot.id, { systemPrompt: e.target.value })}
                                                        className="w-full h-32 bg-black border border-white/5 rounded-xl p-3 text-xs text-gray-400 focus:border-blue-500/50 outline-none transition-all resize-none italic"
                                                        placeholder="Nenhum prompt definido..."
                                                    />
                                                    <p className="text-[9px] text-gray-600 italic">* Alterações no prompt são salvas automaticamente ao sair do campo (blur).</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-white/5 flex justify-end gap-3 bg-[#0d0d0d]">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
