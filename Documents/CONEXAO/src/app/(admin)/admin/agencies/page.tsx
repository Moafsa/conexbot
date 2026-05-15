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
    Activity
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AgenciesAdmin() {
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
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
                            <th className="px-6 py-4">Status Meta</th>
                            <th className="px-6 py-4 text-right">Suporte</th>
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
                                    <div className="w-full bg-white/5 h-2 rounded-full max-w-[100px] overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{ width: '65%' }}></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Meta: R$ 5.000</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleImpersonate(agency.tenantId)}
                                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl font-bold text-xs ml-auto transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <UserCheck size={14} /> Acessar Painel
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
