"use client";

import { Bot, Plus, MoreVertical, MessageSquare, Play, Zap, RefreshCw, Trash2, Settings, Edit, X, LogOut, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BotsPage() {
    const [bots, setBots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchBots = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/bots');
            const data = await res.json();
            if (Array.isArray(data)) setBots(data);
        } catch (err) {
            console.error('Error fetching bots:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (bot: any) => {
        console.log('Bot sharing requested:', { id: bot.id, name: bot.name, token: bot.connectToken });
        
        if (!bot.connectToken) {
            toast.error("Token de conexão não disponível para este bot. Tente atualizar a página.");
            return;
        }

        try {
            const url = `${window.location.origin}/connect/${bot.connectToken}`;
            navigator.clipboard.writeText(url).then(() => {
                toast.success("Link de conexão copiado! Envie-o para seu cliente.");
            }).catch(err => {
                console.error('Clipboard error:', err);
                toast.error("Erro ao copiar link. Tente copiar manualmente.");
            });
        } catch (err) {
            console.error('Share error:', err);
            toast.error("Erro inesperado ao gerar link.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este agente? Esta ação é irreversível.')) {
            return;
        }

        try {
            const res = await fetch(`/api/bots/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setBots(prev => prev.filter(b => b.id !== id));
            } else {
                alert('Erro ao excluir agente.');
            }
        } catch (error) {
            console.error('Failed to delete bot:', error);
            alert('Erro ao excluir agente.');
        } finally {
            setOpenDropdown(null);
        }
    };

    const handleClone = async (id: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/bots/${id}/clone`, {
                method: 'POST',
            });

            if (res.ok) {
                const newBot = await res.json();
                setBots(prev => [newBot, ...prev]);
                alert('Agente duplicado com sucesso!');
            } else {
                const data = await res.json();
                alert(`Erro ao duplicar agente: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Failed to clone bot:', error);
            alert('Erro ao duplicar agente.');
        } finally {
            setLoading(false);
            setOpenDropdown(null);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Deseja desconectar o WhatsApp deste agente?')) return;
        try {
            setLoading(true);
            const res = await fetch('/api/whatsapp/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botId: id })
            });

            if (res.ok) {
                alert('WhatsApp desconectado com sucesso!');
                fetchBots();
            } else {
                alert('Erro ao desconectar.');
            }
        } catch (error) {
            console.error('Failed to disconnect bot:', error);
            alert('Erro ao desconectar.');
        } finally {
            setLoading(false);
            setOpenDropdown(null);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        fetchBots();

        // Refresh list when page becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchBots();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in" onClick={() => setOpenDropdown(null)}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Meus Agentes</h1>
                    <p className="text-gray-400">Gerencie seus bots ativos e configurações.</p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchBots(); }}
                        className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base h-11 sm:h-auto"
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        <span>Atualizar</span>
                    </button>
                    <Link href="/dashboard/create-bot" className="btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base h-11 sm:h-auto text-center">
                        <Plus size={18} />
                        <span>Novo Agente</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && bots.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-gray-500">
                        Carregando...
                    </div>
                ) : bots.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-gray-500">
                        Nenhum agente encontrado.
                    </div>
                ) : (
                    bots.map((bot: any) => (
                        <div key={bot.id} className="glass p-6 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 uppercase font-bold">
                                    {bot.name.substring(0, 2)}
                                </div>
                                <div className="relative">
                                    <button
                                        className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdown(openDropdown === bot.id ? null : bot.id);
                                        }}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openDropdown === bot.id && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="p-1">
                                                <Link
                                                    href={`/dashboard/bots/${bot.id}`}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <Settings size={16} />
                                                    Gerenciar
                                                </Link>
                                                <button
                                                    onClick={() => handleClone(bot.id)}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-indigo-400 hover:bg-white/5 hover:text-indigo-300 rounded-lg transition-colors"
                                                >
                                                    <Plus size={16} />
                                                    Duplicar
                                                </button>
                                                <Link
                                                    href={`/dashboard/create-bot?id=${bot.id}`}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                    Editar Prompt
                                                </Link>
                                                {bot.connectionStatus === 'CONNECTED' && (
                                                    <button
                                                        onClick={() => handleDisconnect(bot.id)}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-orange-400 hover:bg-white/5 hover:text-orange-300 rounded-lg transition-colors border-t border-white/5 mt-1 pt-2"
                                                    >
                                                        <LogOut size={16} />
                                                        Desconectar WhatsApp
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleShare(bot)}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-400 hover:bg-white/5 hover:text-emerald-300 rounded-lg transition-colors"
                                                >
                                                    <Share2 size={16} />
                                                    Compartilhar QR Code
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bot.id)}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h3 className="font-bold text-lg mb-1">{bot.name}</h3>
                            <p className="text-sm text-gray-400 mb-3">{bot.businessType}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                                <span className={`w-2 h-2 rounded-full ${bot.connectionStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-yellow-500'} animate-pulse`}></span>
                                <span className={bot.connectionStatus === 'CONNECTED' ? 'text-emerald-500' : 'text-yellow-500'}>
                                    {bot.connectionStatus === 'CONNECTED' ? 'Conectado' : (bot.connectionStatus || 'Aguardando Conexão')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Conversas</p>
                                    <p className="font-bold">{bot._count?.conversations || 0}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Pagamentos</p>
                                    <p className="font-bold">{bot.enablePayments ? '✓' : '—'}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {bot.sessionName ? (
                                    <>
                                        <Link
                                            href={`/dashboard/bots/${bot.id}`}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare size={16} />
                                            Gerenciar & Testar
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href={`/dashboard/connect?botId=${bot.id}`}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors text-center"
                                        >
                                            Conectar WhatsApp
                                        </Link>
                                    </>
                                )}
                                <button
                                    className="p-2 bg-emerald-600/10 hover:bg-emerald-600/20 rounded-lg text-emerald-400 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(bot);
                                    }}
                                    title="Compartilhar Link de Conexão"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/dashboard/create-bot?id=${bot.id}`);
                                    }}
                                    title="Configurações Rápidas"
                                >
                                    <Settings size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
