import React from 'react';
import { Users, Bot, CreditCard, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-400 mt-2">Visão geral da plataforma Conexao.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total de Usuários" value="0" icon={<Users className="text-blue-400" />} trend="+0%" />
                <StatCard title="Bots Ativos" value="0" icon={<Bot className="text-emerald-400" />} trend="+0%" />
                <StatCard title="Receita Mensal" value="R$ 0,00" icon={<CreditCard className="text-purple-400" />} trend="+0%" />
                <StatCard title="Novos Leads" value="0" icon={<TrendingUp className="text-amber-400" />} trend="+0%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">Atividade Recente</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Nenhuma atividade registrada hoje.
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">Status do Sistema</h3>
                    <div className="space-y-4">
                        <SystemItem label="Asaas API" status="ONLINE" color="bg-emerald-500" />
                        <SystemItem label="Database" status="ONLINE" color="bg-emerald-500" />
                        <SystemItem label="OpenAI" status="ONLINE" color="bg-emerald-500" />
                        <SystemItem label="WuzAPI" status="CHECKING" color="bg-amber-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend: string }) {
    return (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-2xl hover:border-blue-500/50 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#151515] rounded-xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <span className="text-emerald-400 text-sm font-medium">{trend}</span>
            </div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <h2 className="text-2xl font-bold mt-1">{value}</h2>
            </div>
        </div>
    );
}

function SystemItem({ label, status, color }: { label: string; status: string; color: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-[#151515] rounded-xl border border-[#222]">
            <span className="font-medium">{label}</span>
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${color}`}></div>
                <span className="text-xs font-bold uppercase">{status}</span>
            </div>
        </div>
    );
}
