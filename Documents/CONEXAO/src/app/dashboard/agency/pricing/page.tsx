"use client";

import { useState, useEffect } from "react";
import { 
    Tag, 
    Save, 
    AlertCircle, 
    CheckCircle2,
    Percent,
    DollarSign,
    Zap,
    Eye
} from "lucide-react";

export default function AgencyPricing() {
    const [products, setProducts] = useState<any[]>([]);
    const [pricing, setPricing] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, prRes] = await Promise.all([
                fetch("/api/admin/marketplace/products"),
                fetch("/api/settings/agency/pricing")
            ]);
            const productsData = pRes.ok ? await pRes.json() : [];
            const pricingData = prRes.ok ? await prRes.json() : [];
            setProducts(Array.isArray(productsData) ? productsData : []);
            setPricing(Array.isArray(pricingData) ? pricingData : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateField = (productId: string, field: string, value: string) => {
        const val = parseFloat(value) || 0;
        setPricing(prev => {
            const existing = prev.find((p: any) => p.productId === productId);
            if (existing) {
                return prev.map((p: any) => p.productId === productId ? { ...p, [field]: val } : p);
            }
            return [...prev, { productId, markupPercent: 0, setupPrice: 0, [field]: val }];
        });
    };

    const getAgencyPrice = (productId: string) => {
        return pricing.find((p: any) => p.productId === productId) || { markupPercent: 0, setupPrice: 0 };
    };

    const getFinalPrice = (basePrice: number, markupPercent: number) => {
        return basePrice * (1 + markupPercent / 100);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Save with computed monthlyPrice = base * (1 + markup/100)
            const payload = pricing.map((p: any) => {
                const product = products.find((prod: any) => prod.id === p.productId);
                
                // Se tiver planos, a base para o AgencyPricing.monthlyPrice (valor de referência) 
                // será o menor preço entre os planos.
                let base = product?.minMonthlyPrice || 0;
                if (product?.plans && product.plans.length > 0) {
                    base = Math.min(...product.plans.map((pl: any) => pl.price));
                }

                return {
                    ...p,
                    monthlyPrice: getFinalPrice(base, p.markupPercent)
                };
            });
            const res = await fetch("/api/settings/agency/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Preços salvos com sucesso!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao salvar.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
                <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 text-sm">Carregando produtos do marketplace...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Tag className="text-emerald-500" />
                        Minha Tabela de Preços
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Configure seu markup sobre o preço de atacado. Você fica com a diferença.
                    </p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                    {saving ? "Salvando..." : <><Save size={20} /> Salvar Preços</>}
                </button>
            </div>

            {/* Feedback message */}
            {message && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm ${
                    message.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 flex gap-4 items-start">
                <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm space-y-1">
                    <p className="text-blue-400 font-bold">Como funciona o Markup</p>
                    <p className="text-gray-400">
                        Configure um <strong className="text-white">percentual de margem</strong> sobre o preço de atacado da plataforma. 
                        O preço final ao cliente = preço base × (1 + markup%). Você recebe a diferença menos a taxa da plataforma.
                    </p>
                </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <Tag size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Nenhum produto disponível no marketplace ainda.</p>
                    <p className="text-xs mt-1">O administrador ainda não cadastrou produtos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {products.map((product: any) => {
                        const agencyPrice = getAgencyPrice(product.id);
                        const markup = agencyPrice.markupPercent || 0;
                        
                        // Determinar o preço base real (se tiver planos, usa o menor preço de plano)
                        let base = product.minMonthlyPrice;
                        const hasPlans = product.plans && product.plans.length > 0;
                        
                        if (hasPlans) {
                            base = Math.min(...product.plans.map((pl: any) => pl.price));
                        }

                        const finalPrice = getFinalPrice(base, markup);
                        const margin = finalPrice - base;

                        return (
                            <div key={product.id} className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6 relative overflow-hidden group hover:border-white/20 transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16" />
                                
                                {/* Product header */}
                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <h3 className="text-xl font-bold">{product.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                                        <Zap size={24} />
                                    </div>
                                </div>

                                {/* Base price info */}
                                <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between relative z-10">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Preço Base (Atacado)</p>
                                        <p className="text-2xl font-black text-white">R$ {base.toFixed(2)}<span className="text-xs text-gray-500 font-normal">/mês</span></p>
                                    </div>
                                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                        CUSTO ATACADO
                                    </div>
                                </div>

                                {/* Markup + Setup inputs */}
                                <div className="grid grid-cols-2 gap-4 relative z-10">
                                    {/* Markup % */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                                            <Percent size={12} /> Markup (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="1000"
                                                step="1"
                                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-xl font-bold outline-none focus:border-emerald-500/50 transition-all"
                                                value={markup}
                                                onChange={(e) => handleUpdateField(product.id, 'markupPercent', e.target.value)}
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span>
                                        </div>
                                        <p className="text-[10px] text-gray-600 italic">Ex: 50% → cliente paga R$ {getFinalPrice(base, 50).toFixed(2)}</p>
                                    </div>

                                    {/* Setup fee */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                                            <DollarSign size={12} /> Taxa de Setup
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold outline-none focus:border-emerald-500/50 transition-all"
                                                value={agencyPrice.setupPrice || 0}
                                                onChange={(e) => handleUpdateField(product.id, 'setupPrice', e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-600 italic">Cobrado na ativação</p>
                                    </div>
                                </div>

                                {/* Final price preview */}
                                <div className="pt-6 border-t border-white/5 relative z-10 space-y-3">
                                    <h4 className="text-sm font-bold text-gray-300">Preview dos Planos</h4>
                                    {(product.plans && product.plans.length > 0) ? (
                                        <div className="space-y-2">
                                            {product.plans.map((plan: any) => {
                                                const pFinalPrice = getFinalPrice(plan.price, markup);
                                                const pMargin = pFinalPrice - plan.price;
                                                return (
                                                    <div key={plan.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                                                <Zap size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white">{plan.name}</p>
                                                                <p className="text-[10px] text-gray-500">Custo: R$ {plan.price.toFixed(2)}/mês</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between sm:text-right gap-6">
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Venda</p>
                                                                <p className="text-lg font-black text-white">
                                                                    R$ {pFinalPrice.toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500/50">Sua Margem</p>
                                                                <p className={`text-lg font-black ${pMargin > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                                    + R$ {pMargin.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Eye size={16} />
                                                <div>
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Preço Único ao Cliente</p>
                                                    <p className="text-2xl font-black text-white">
                                                        R$ {finalPrice.toFixed(2)}<span className="text-xs text-gray-500 font-normal">/mês</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Sua Margem</p>
                                                <p className={`text-xl font-black ${margin > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                    + R$ {margin.toFixed(2)}<span className="text-xs font-normal">/mês</span>
                                                </p>
                                                {agencyPrice.setupPrice > 0 && (
                                                    <p className="text-[10px] text-gray-500">+ R$ {agencyPrice.setupPrice.toFixed(2)} setup</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
