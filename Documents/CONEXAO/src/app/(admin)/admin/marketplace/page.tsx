"use client";

import { useState, useEffect } from "react";
import { 
    ShoppingBag, 
    Plus, 
    Trash2, 
    DollarSign, 
    BarChart3, 
    Save,
    Settings,
    ShieldAlert
} from "lucide-react";

export default function MarketplaceAdmin() {
    const [products, setProducts] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("products");
    
    // Modal States
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [productForm, setProductForm] = useState({ name: "", description: "", minMonthlyPrice: 0, minSetupPrice: 0 });

    const [showTierModal, setShowTierModal] = useState(false);
    const [editingTier, setEditingTier] = useState<any>(null);
    const [tierForm, setTierForm] = useState({ name: "", minSalesVolume: 0, feePercentage: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, tRes] = await Promise.all([
                fetch("/api/admin/marketplace/products"),
                fetch("/api/admin/marketplace/tiers")
            ]);
            setProducts(await pRes.json());
            setTiers(await tRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async () => {
        const method = editingProduct ? "PUT" : "POST";
        const body = editingProduct ? { ...productForm, id: editingProduct.id } : productForm;

        await fetch("/api/admin/marketplace/products", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({ name: "", description: "", minMonthlyPrice: 0, minSetupPrice: 0 });
        fetchData();
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este produto do catálogo global?")) return;
        await fetch(`/api/admin/marketplace/products?id=${id}`, { method: "DELETE" });
        fetchData();
    };

    const handleSaveTier = async () => {
        const method = editingTier ? "PUT" : "POST";
        const body = editingTier ? { ...tierForm, id: editingTier.id } : tierForm;

        await fetch("/api/admin/marketplace/tiers", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        
        setShowTierModal(false);
        setEditingTier(null);
        setTierForm({ name: "", minSalesVolume: 0, feePercentage: 0 });
        fetchData();
    };

    const handleDeleteTier = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este nível?")) return;
        await fetch(`/api/admin/marketplace/tiers?id=${id}`, { method: "DELETE" });
        fetchData();
    };

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShoppingBag className="text-emerald-500" />
                        Marketplace Admin
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie produtos globais e regras de taxas para agências.</p>
                </div>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveTab("products")}
                    className={`px-6 py-2 rounded-xl transition-all font-medium ${activeTab === "products" ? "bg-emerald-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                >
                    Catálogo de Produtos
                </button>
                <button 
                    onClick={() => setActiveTab("tiers")}
                    className={`px-6 py-2 rounded-xl transition-all font-medium ${activeTab === "tiers" ? "bg-emerald-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                >
                    Níveis de Taxas (Tiers)
                </button>
            </div>

            {activeTab === "products" ? (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => {
                                setEditingProduct(null);
                                setProductForm({ name: "", description: "", minMonthlyPrice: 0, minSetupPrice: 0 });
                                setShowProductModal(true);
                            }} 
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl font-bold text-sm"
                        >
                            <Plus size={18} /> Novo Produto
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product: any) => (
                            <div key={product.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">{product.name}</h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                setEditingProduct(product);
                                                setProductForm({ 
                                                    name: product.name, 
                                                    description: product.description || "", 
                                                    minMonthlyPrice: product.minMonthlyPrice, 
                                                    minSetupPrice: product.minSetupPrice 
                                                });
                                                setShowProductModal(true);
                                            }}
                                            className="text-gray-400 hover:text-white p-2 bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Settings size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">{product.description}</p>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Mensal Mín.</p>
                                        <p className="text-xl font-black text-emerald-400">R$ {product.minMonthlyPrice}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Setup Mín.</p>
                                        <p className="text-xl font-black text-blue-400">R$ {product.minSetupPrice}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => {
                                setEditingTier(null);
                                setTierForm({ name: "", minSalesVolume: 0, feePercentage: 0 });
                                setShowTierModal(true);
                            }} 
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl font-bold text-sm"
                        >
                            <Plus size={18} /> Novo Nível
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Nível</th>
                                    <th className="px-6 py-4">Meta Mensal (Volume)</th>
                                    <th className="px-6 py-4">Taxa da Plataforma (%)</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tiers.map((tier: any) => (
                                    <tr key={tier.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white">{tier.name || "Sem Nome"}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-400">R$ {tier.minSalesVolume.toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 font-black text-2xl">{tier.feePercentage}%</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setEditingTier(tier);
                                                        setTierForm({ 
                                                            name: tier.name || "", 
                                                            minSalesVolume: tier.minSalesVolume, 
                                                            feePercentage: tier.feePercentage 
                                                        });
                                                        setShowTierModal(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-lg"
                                                >
                                                    <Settings size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTier(tier.id)}
                                                    className="p-2 text-red-400 hover:text-red-300 transition-colors bg-red-500/10 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4 items-start">
                        <ShieldAlert className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-amber-500">Regra de Taxa Dinâmica Ativa</h4>
                            <p className="text-sm text-gray-400 mt-1">O volume de vendas do mês atual determinará a taxa aplicada a cada agência no mês seguinte. O processamento ocorre automaticamente no primeiro dia de cada mês.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161b2c] border border-white/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editingProduct ? <Settings size={20} className="text-emerald-500" /> : <Plus size={20} className="text-emerald-500" />}
                                {editingProduct ? "Editar Produto" : "Novo Produto"}
                            </h2>
                            <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-white">&times;</button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome do Produto</label>
                                <input 
                                    value={productForm.name}
                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    placeholder="Ex: WHATSAPP_BOT"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                                <textarea 
                                    value={productForm.description}
                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[100px]"
                                    placeholder="Descreva as funcionalidades..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Mensal Mín. (R$)</label>
                                    <input 
                                        type="number"
                                        value={productForm.minMonthlyPrice}
                                        onChange={e => setProductForm({ ...productForm, minMonthlyPrice: parseFloat(e.target.value) })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Setup Mín. (R$)</label>
                                    <input 
                                        type="number"
                                        value={productForm.minSetupPrice}
                                        onChange={e => setProductForm({ ...productForm, minSetupPrice: parseFloat(e.target.value) })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowProductModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-medium">Cancelar</button>
                            <button onClick={handleSaveProduct} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tier Modal */}
            {showTierModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161b2c] border border-white/10 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editingTier ? <Settings size={20} className="text-emerald-500" /> : <Plus size={20} className="text-emerald-500" />}
                                {editingTier ? "Editar Nível" : "Novo Nível"}
                            </h2>
                            <button onClick={() => setShowTierModal(false)} className="text-gray-500 hover:text-white">&times;</button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome do Nível</label>
                                <input 
                                    value={tierForm.name}
                                    onChange={e => setTierForm({ ...tierForm, name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    placeholder="Ex: Bronze, VIP, Diamond"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Volume Mensal (R$)</label>
                                <input 
                                    type="number"
                                    value={tierForm.minSalesVolume}
                                    onChange={e => setTierForm({ ...tierForm, minSalesVolume: parseFloat(e.target.value) })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    placeholder="5000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Taxa da Plataforma (%)</label>
                                <input 
                                    type="number"
                                    value={tierForm.feePercentage}
                                    onChange={e => setTierForm({ ...tierForm, feePercentage: parseFloat(e.target.value) })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    placeholder="15"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowTierModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-medium">Cancelar</button>
                            <button onClick={handleSaveTier} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
