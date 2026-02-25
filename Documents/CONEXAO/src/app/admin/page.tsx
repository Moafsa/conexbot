"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Bot, DollarSign, Activity } from "lucide-react";

interface AdminData {
    totalTenants: number;
    totalBots: number;
    totalMessages: number;
    activeSubscriptions: number;
    recentTenants: Array<{
        id: string;
        name: string | null;
        email: string;
        createdAt: string;
        _count: { bots: number };
    }>;
}

export default function AdminPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const stats = [
        { label: "Total Clientes", value: data?.totalTenants || 0, icon: Users, color: "from-blue-500 to-cyan-400" },
        { label: "Bots Ativos", value: data?.totalBots || 0, icon: Bot, color: "from-green-500 to-emerald-400" },
        { label: "Assinaturas Ativas", value: data?.activeSubscriptions || 0, icon: DollarSign, color: "from-amber-500 to-orange-400" },
        { label: "Total Mensagens", value: data?.totalMessages || 0, icon: Activity, color: "from-indigo-500 to-blue-400" },
    ];

    return (
        <>
            <h1 className="text-2xl font-bold text-white mb-8">Painel Administrativo</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map(stat => (
                    <div key={stat.label} className="glass rounded-2xl p-6 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-400 text-sm">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="glass rounded-2xl p-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-6">Clientes Recentes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10">
                                <th className="text-left py-3 px-4">Nome</th>
                                <th className="text-left py-3 px-4">Email</th>
                                <th className="text-center py-3 px-4">Bots</th>
                                <th className="text-left py-3 px-4">Cadastro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.recentTenants.map(tenant => (
                                <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-4 text-white">{tenant.name || "-"}</td>
                                    <td className="py-3 px-4 text-gray-400">{tenant.email}</td>
                                    <td className="py-3 px-4 text-center text-white">{tenant._count.bots}</td>
                                    <td className="py-3 px-4 text-gray-400">
                                        {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
