'use client';

import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function PlansAdminPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/plans');
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            console.error('Failed to fetch plans');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Planos</h1>
                    <p className="text-gray-400 mt-2">Crie e gerencie ofertas e limites para seus clientes.</p>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2 active:scale-95">
                    <Plus size={20} />
                    <span>Novo Plano</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        Carregando planos...
                    </div>
                ) : plans.length === 0 ? (
                    <div className="col-span-full py-20 bg-[#0a0a0a] border border-dashed border-[#222] rounded-3xl text-center text-gray-500">
                        Nenhum plano cadastrado ainda.
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-[#151515] rounded-xl group-hover:bg-emerald-500/10 transition-colors">
                                    <Package className="text-emerald-400" size={24} />
                                </div>
                                <div className="flex space-x-1">
                                    <button className="p-2 hover:bg-[#151515] rounded-lg transition-colors text-gray-500 hover:text-white"><Edit size={16} /></button>
                                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold uppercase tracking-tight">{plan.name}</h3>
                                <div className="text-3xl font-bold mt-2">
                                    R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    <span className="text-sm font-normal text-gray-500">/mês</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <FeatureItem label={`${plan.botLimit} Bots`} />
                                <FeatureItem label={`${plan.messageLimit} Mensagens/mês`} />
                                <FeatureItem label={plan.active ? "Ativo para Venda" : "Inativo"} inactive={!plan.active} />
                            </div>

                            <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between text-xs text-gray-500">
                                <span>Ref: {plan.externalId || 'S/ Ref Asaas'}</span>
                                <span>ID: {plan.id.substring(0, 8)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function FeatureItem({ label, inactive }: { label: string; inactive?: boolean }) {
    return (
        <div className={`flex items-center space-x-2 text-sm ${inactive ? 'text-gray-600' : 'text-gray-300'}`}>
            {inactive ? <XCircle size={14} className="text-gray-600" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
            <span>{label}</span>
        </div>
    );
}
