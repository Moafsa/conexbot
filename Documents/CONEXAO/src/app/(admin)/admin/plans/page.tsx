'use client';

import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function PlansAdminPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [saving, setSaving] = useState(false);

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

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/plans', {
                method: editingPlan.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPlan)
            });
            if (res.ok) {
                fetchPlans();
                setIsModalOpen(false);
                setEditingPlan(null);
            }
        } catch (error) {
            console.error('Failed to save plan');
        } finally {
            setSaving(false);
        }
    };

    const calculateDiscount = (periodPrice: number | undefined, months: number) => {
        if (!editingPlan?.price || !periodPrice) return 0;
        const baseTotal = editingPlan.price * months;
        if (baseTotal <= 0) return 0;
        const discount = 100 - ((periodPrice / baseTotal) * 100);
        return discount > 0 ? Math.round(discount) : 0;
    };

    const handleDiscountChange = (percentage: number, months: number, field: string) => {
        const baseTotal = (editingPlan?.price || 0) * months;
        if (baseTotal === 0) return;
        const newPrice = baseTotal * (1 - (percentage / 100));
        setEditingPlan({ ...editingPlan, [field]: newPrice });
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Planos</h1>
                    <p className="text-gray-400 mt-2">Crie e gerencie ofertas e limites para seus clientes.</p>
                </div>
                <button 
                    onClick={() => { setEditingPlan({ name: '', price: 0, priceQuarterly: 0, priceSemiannual: 0, priceYearly: 0, trialDays: 0, botLimit: 1, messageLimit: 500, active: true, platformSplitType: 'PERCENTAGE', platformSplitValue: 0 }); setIsModalOpen(true); }}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2 active:scale-95"
                >
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
                                    <button 
                                        onClick={() => handleEdit(plan)}
                                        className="p-2 hover:bg-[#151515] rounded-lg transition-colors text-gray-500 hover:text-white"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold uppercase tracking-tight">{plan.name}</h3>
                                    {plan.trialDays > 0 && (
                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-lg shadow-blue-500/10">
                                            Trial
                                        </span>
                                    )}
                                </div>
                                <div className="text-3xl font-bold mt-2">
                                    R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    <span className="text-sm font-normal text-gray-500">/mês</span>
                                </div>
                                {plan.trialDays > 0 && (
                                    <div className="text-xs text-blue-400 font-bold mt-1 uppercase tracking-wider">
                                        {plan.trialDays} Dias de Trial Grátis
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 mb-8">
                                <FeatureItem label={`${plan.botLimit} Bots`} />
                                <FeatureItem label={`${plan.messageLimit === 0 ? 'Mensagens Ilimitadas' : `${plan.messageLimit} Mensagens/mês`}`} />
                                {(plan.features || []).map((f: any, i: number) => (
                                    <FeatureItem key={i} label={f.text} inactive={!f.enabled} />
                                ))}
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

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center bg-[#111]">
                            <h2 className="text-xl font-bold">{editingPlan?.id ? 'Editar Plano' : 'Novo Plano'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-white">
                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-4">
                                <h3 className="text-sm font-bold text-blue-400">Configuração de Trial (Teste Grátis)</h3>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase block">Dias de Acesso Gratuito</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number"
                                            value={editingPlan?.trialDays || 0} 
                                            onChange={e => setEditingPlan({...editingPlan, trialDays: parseInt(e.target.value)})}
                                            className="w-32 bg-black border border-[#222] rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all text-white"
                                            placeholder="0"
                                        />
                                        <span className="text-sm text-gray-400">dias de uso completo antes da primeira cobrança</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        * Defina como 0 para desabilitar o período de teste.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome do Plano</label>
                                <input 
                                    value={editingPlan?.name || ''} 
                                    onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                                    className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Ex: Plano Profissional"
                                />
                            </div>

                            <div className="space-y-4 border-t border-b border-[#222] py-4">
                                <h3 className="text-sm font-bold text-gray-300">Tabela de Preços e Descontos</h3>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-emerald-400">Mensal (Preço Base)</h4>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Preço Mensal (R$)</label>
                                        <input 
                                            type="number"
                                            value={editingPlan?.price || ''} 
                                            onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})}
                                            className="w-full bg-[#151515] border border-emerald-500/50 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-emerald-400">Trimestral (3 meses)</h4>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Desconto (%)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={calculateDiscount(editingPlan?.priceQuarterly, 3) || ''} 
                                                    onChange={e => handleDiscountChange(parseFloat(e.target.value) || 0, 3, 'priceQuarterly')}
                                                    className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 pr-8 text-sm focus:border-emerald-500 outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Preço Final (Por R$)</label>
                                            <input 
                                                type="number"
                                                value={editingPlan?.priceQuarterly || ''} 
                                                onChange={e => setEditingPlan({...editingPlan, priceQuarterly: parseFloat(e.target.value)})}
                                                className="w-full bg-[#151515] border border-emerald-500/50 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        {calculateDiscount(editingPlan?.priceQuarterly, 3) > 0 && (
                                            <p className="text-[10px] text-gray-500">
                                                De <span className="line-through">R$ {((editingPlan?.price || 0) * 3).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span> por R$ {(editingPlan?.priceQuarterly || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-emerald-400">Semestral (6 meses)</h4>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Desconto (%)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={calculateDiscount(editingPlan?.priceSemiannual, 6) || ''} 
                                                    onChange={e => handleDiscountChange(parseFloat(e.target.value) || 0, 6, 'priceSemiannual')}
                                                    className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 pr-8 text-sm focus:border-emerald-500 outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Preço Final (Por R$)</label>
                                            <input 
                                                type="number"
                                                value={editingPlan?.priceSemiannual || ''} 
                                                onChange={e => setEditingPlan({...editingPlan, priceSemiannual: parseFloat(e.target.value)})}
                                                className="w-full bg-[#151515] border border-emerald-500/50 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        {calculateDiscount(editingPlan?.priceSemiannual, 6) > 0 && (
                                            <p className="text-[10px] text-gray-500">
                                                De <span className="line-through">R$ {((editingPlan?.price || 0) * 6).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span> por R$ {(editingPlan?.priceSemiannual || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-emerald-400">Anual (12 meses)</h4>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Desconto (%)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={calculateDiscount(editingPlan?.priceYearly, 12) || ''} 
                                                    onChange={e => handleDiscountChange(parseFloat(e.target.value) || 0, 12, 'priceYearly')}
                                                    className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 pr-8 text-sm focus:border-emerald-500 outline-none transition-all"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Preço Final (Por R$)</label>
                                            <input 
                                                type="number"
                                                value={editingPlan?.priceYearly || ''} 
                                                onChange={e => setEditingPlan({...editingPlan, priceYearly: parseFloat(e.target.value)})}
                                                className="w-full bg-[#151515] border border-emerald-500/50 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        {calculateDiscount(editingPlan?.priceYearly, 12) > 0 && (
                                            <p className="text-[10px] text-gray-500">
                                                De <span className="line-through">R$ {((editingPlan?.price || 0) * 12).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span> por R$ {(editingPlan?.priceYearly || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Descrição (Benefícios)</label>
                                <textarea 
                                    value={editingPlan?.description || ''} 
                                    onChange={e => setEditingPlan({...editingPlan, description: e.target.value})}
                                    className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all h-24 resize-none"
                                    placeholder="Descreva as vantagens do plano..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Limite de Bots</label>
                                    <input 
                                        type="number"
                                        value={editingPlan?.botLimit || 0} 
                                        onChange={e => setEditingPlan({...editingPlan, botLimit: parseInt(e.target.value)})}
                                        className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Limite de Mensagens (0 = ilimitado)</label>
                                    <input 
                                        type="number"
                                        value={editingPlan?.messageLimit || 0} 
                                        onChange={e => setEditingPlan({...editingPlan, messageLimit: parseInt(e.target.value)})}
                                        className="w-full bg-[#151515] border border-[#222] rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recursos Inclusos (Checks)</label>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const features = editingPlan.features || [];
                                            setEditingPlan({...editingPlan, features: [...features, { text: '', enabled: true }]});
                                        }}
                                        className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                                    >
                                        <Plus size={10} /> Add Recurso
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {(editingPlan?.features || []).map((feature: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const newFeatures = [...editingPlan.features];
                                                    newFeatures[idx].enabled = !newFeatures[idx].enabled;
                                                    setEditingPlan({...editingPlan, features: newFeatures});
                                                }}
                                                className={`p-2 rounded-lg transition-all ${feature.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <input 
                                                value={feature.text}
                                                onChange={e => {
                                                    const newFeatures = [...editingPlan.features];
                                                    newFeatures[idx].text = e.target.value;
                                                    setEditingPlan({...editingPlan, features: newFeatures});
                                                }}
                                                className="flex-grow bg-black border border-[#222] rounded-lg p-2 text-xs focus:border-emerald-500 outline-none text-white"
                                                placeholder="Ex: Suporte VIP"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const newFeatures = editingPlan.features.filter((_: any, i: number) => i !== idx);
                                                    setEditingPlan({...editingPlan, features: newFeatures});
                                                }}
                                                className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(editingPlan?.features || []).length === 0 && (
                                        <p className="text-[10px] text-gray-600 italic">Nenhum recurso extra adicionado.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <input 
                                    type="checkbox"
                                    id="plan-active"
                                    checked={editingPlan?.active ?? true}
                                    onChange={e => setEditingPlan({...editingPlan, active: e.target.checked})}
                                    className="w-5 h-5 accent-emerald-500"
                                />
                                <label htmlFor="plan-active" className="text-sm font-medium cursor-pointer">
                                    Plano Ativo (Visível no site para novos clientes)
                                </label>
                            </div>

                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4">
                                <h3 className="text-sm font-bold text-emerald-400">Configuração de Split (Taxa da Plataforma)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo</label>
                                        <select 
                                            value={editingPlan?.platformSplitType || 'PERCENTAGE'}
                                            onChange={e => setEditingPlan({...editingPlan, platformSplitType: e.target.value})}
                                            className="w-full bg-black border border-[#222] rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all text-white"
                                        >
                                            <option value="PERCENTAGE">Porcentagem (%)</option>
                                            <option value="FIXED">Valor Fixo (R$)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Valor da Taxa</label>
                                        <input 
                                            type="number"
                                            value={editingPlan?.platformSplitValue || 0} 
                                            onChange={e => setEditingPlan({...editingPlan, platformSplitValue: parseFloat(e.target.value)})}
                                            className="w-full bg-black border border-[#222] rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all text-white"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 italic">
                                    * Esta taxa será descontada de cada venda e enviada para a carteira da plataforma (SuperAdmin).
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Plano'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
