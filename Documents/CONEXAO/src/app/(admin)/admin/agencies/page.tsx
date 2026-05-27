"use client";

import { useState, useEffect } from "react";
import { 
    Users, 
    Search, 
    ExternalLink, 
    TrendingUp, 
    UserCheck,
    CreditCard,
    MoreVertical,
    Activity,
    CheckCircle,
    XCircle,
    Clock,
    Key
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AgenciesAdmin() {
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/agencies"); // Vou criar esta rota
            const data = await res.json();
            setAgencies(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async (targetId: string) => {
        try {
            const res = await fetch("/api/admin/impersonate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetId })
            });
            if (res.ok) {
                // Redireciona para o dashboard principal já no contexto da agência
                window.location.href = "/dashboard";
            }
        } catch (error) {
            alert("Erro ao personificar");
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        if (!confirm(`Tem certeza que deseja marcar esta agência como ${status}?`)) return;
        
        try {
            const res = await fetch("/api/admin/agencies", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                fetchAgencies();
            } else {
                alert("Erro ao atualizar status");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão");
        }
    };

    const handleUpdatePassword = async () => {
        if (!selectedAgencyId || !newPassword) return;
        if (newPassword.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedAgencyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                alert("Senha atualizada com sucesso!");
                setIsPasswordModalOpen(false);
                setNewPassword("");
                setSelectedAgencyId(null);
            } else {
                alert("Erro ao atualizar a senha.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de comunicação com o servidor.");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="text-blue-500" />
                        Gestão de Agências
                    </h1>
                    <p className="text-gray-400 mt-1">Monitore performance e preste suporte aos seus parceiros.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Agências" value={agencies.length} icon={Users} color="text-blue-500" />
                <StatCard title="Volume Mensal (Total)" value={`R$ ${agencies.reduce((acc: any, curr: any) => acc + curr.salesVolumeCurrentMonth, 0).toLocaleString()}`} icon={TrendingUp} color="text-emerald-500" />
                <StatCard title="Comissão Projetada" value={`R$ ${agencies.reduce((acc: any, curr: any) => acc + (curr.salesVolumeCurrentMonth * curr.currentFee / 100), 0).toLocaleString()}`} icon={CreditCard} color="text-purple-500" />
                <StatCard title="Atividade 24h" value="85%" icon={Activity} color="text-amber-500" />
            </div>

            {/* Agencies List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por agência ou e-mail..."
                            className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-6 py-4">Agência / Parceiro</th>
                            <th className="px-6 py-4">Vendas (Mês)</th>
                            <th className="px-6 py-4">Taxa Atual</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {agencies.map((agency: any) => (
                            <tr key={agency.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                                            {agency.tenant.name?.charAt(0) || "A"}
                                        </div>
                                        <div>
                                            <p className="font-bold">{agency.tenant.name}</p>
                                            <p className="text-xs text-gray-500">{agency.tenant.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-black text-emerald-400">R$ {agency.salesVolumeCurrentMonth.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-500">Total: R$ {agency.salesVolumeLifetime.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                                        {agency.currentFee}%
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {agency.status === 'APPROVED' ? (
                                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                            <CheckCircle size={14} /> Ativa
                                        </span>
                                    ) : agency.status === 'REJECTED' ? (
                                        <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-widest">
                                            <XCircle size={14} /> Rejeitada
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-widest">
                                            <Clock size={14} /> Pendente
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {agency.status !== 'APPROVED' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(agency.id, 'APPROVED')}
                                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all"
                                                title="Aprovar Agência"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {agency.status === 'PENDING' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(agency.id, 'REJECTED')}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                                title="Rejeitar Agência"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                setSelectedAgencyId(agency.tenantId);
                                                setIsPasswordModalOpen(true);
                                            }}
                                            className="flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
                                            title="Alterar Senha"
                                        >
                                            <Key size={14} /> Senha
                                        </button>
                                        <button 
                                            onClick={() => handleImpersonate(agency.tenantId)}
                                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            <UserCheck size={14} /> Acessar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1f2e] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Key className="text-purple-400" size={20} />
                                Alterar Senha
                            </h3>
                            <button onClick={() => {
                                setIsPasswordModalOpen(false);
                                setNewPassword("");
                            }} className="text-gray-400 hover:text-white">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nova Senha</label>
                                <input 
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Digite a nova senha..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
                                />
                            </div>
                            <button 
                                onClick={handleUpdatePassword}
                                disabled={isUpdatingPassword || !newPassword}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                {isUpdatingPassword ? "Atualizando..." : "Salvar Nova Senha"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-2xl font-black mt-1">{value}</p>
            </div>
        </div>
    );
}
