'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Usuários</h1>
                    <p className="text-gray-400 mt-2">Gerencie todas as contas da plataforma.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    Novo Usuário
                </button>
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
                                                <button className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-all" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all" title="Excluir">
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
            </div>
        </div>
    );
}
