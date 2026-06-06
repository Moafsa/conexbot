"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Edit, Package, X } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    description?: string;
    imageUrl?: string;
    videoUrl?: string;
    stock: number;
    sku?: string;
    active: boolean;
    allowCoupons: boolean;
    type: 'SINGLE' | 'RECURRING';
    billingPeriod?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
    iterations?: number | null;
    category?: { id: string; name: string } | null;
    addonGroups?: {
        id: string;
        name: string;
        maxChoices: number;
        addons: { id: string; name: string; price: number }[];
    }[];
}

export function ProductManager({ botId }: { botId: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        salePrice: "",
        description: "",
        stock: "0",
        sku: "",
        imageUrl: "",
        videoUrl: "",
        type: "SINGLE",
        billingPeriod: "MONTHLY",
        iterations: "",
        allowCoupons: true,
        categoryName: "",
        addonGroups: [] as { id?: string; name: string; minSelect: number; maxSelect: number; addons: { id?: string; name: string; price: number }[] }[]
    });

    useEffect(() => {
        fetchProducts();
    }, [botId]);

    async function fetchProducts() {
        try {
            const res = await fetch(`/api/products?botId=${botId}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleMagicImport() {
        if (!magicText) return;
        setIsImporting(true);
        try {
            const res = await fetch("/api/products/magic-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ botId, text: magicText }),
            });
            if (res.ok) {
                setIsMagicModalOpen(false);
                setMagicText("");
                fetchProducts();
            } else {
                const errorData = await res.json();
                alert(`Erro ao importar: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error on magic import", error);
            alert("Erro na requisição. Verifique o console.");
        } finally {
            setIsImporting(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const url = editingProduct
                ? `/api/products/${editingProduct.id}`
                : "/api/products";
            const method = editingProduct ? "PUT" : "POST";

            const body = {
                ...formData,
                botId,
                price: parseFloat(formData.price),
                salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
                stock: parseInt(formData.stock),
                iterations: formData.iterations ? parseInt(formData.iterations) : null,
                categoryName: formData.categoryName,
                addonGroups: formData.addonGroups
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingProduct(null);
                setFormData({ name: "", price: "", salePrice: "", description: "", stock: "0", sku: "", imageUrl: "", videoUrl: "", type: "SINGLE", billingPeriod: "MONTHLY", iterations: "", allowCoupons: true, categoryName: "", addonGroups: [] });
                fetchProducts();
            }
        } catch (error) {
            console.error("Error saving product", error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        try {
            await fetch(`/api/products/${id}`, { method: "DELETE" });
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product", error);
        }
    }

    function openEdit(product: Product) {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            salePrice: product.salePrice?.toString() || "",
            description: product.description || "",
            stock: product.stock.toString(),
            sku: product.sku || "",
            imageUrl: product.imageUrl || "",
            videoUrl: product.videoUrl || "",
            type: product.type,
            billingPeriod: product.billingPeriod || "MONTHLY",
            iterations: product.iterations?.toString() || "",
            allowCoupons: product.allowCoupons !== false, // Default to true if undefined
            categoryName: product.category?.name || "",
            addonGroups: product.addonGroups ? product.addonGroups.map(g => ({
                id: g.id,
                name: g.name,
                minSelect: g.minSelect || 0,
                maxSelect: g.maxSelect || 1,
                addons: g.addons.map(a => ({ id: a.id, name: a.name, price: a.price }))
            })) : []
        });
        setIsModalOpen(true);
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    Catálogo de Produtos
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setMagicText("");
                            setIsMagicModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition shadow-md"
                    >
                        ✨ Importar Cardápio Mágico
                    </button>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setFormData({ name: "", price: "", salePrice: "", description: "", stock: "0", sku: "", imageUrl: "", videoUrl: "", type: "SINGLE", billingPeriod: "MONTHLY", iterations: "", allowCoupons: true, categoryName: "", addonGroups: [] });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Produto
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500 text-center py-4">Carregando catálogo...</p>
            ) : products.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">Nenhum produto cadastrado.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Cadastre o primeiro!
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-left">Nome</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-left">Tipo</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-left">Preço</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-left">Estoque</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-center">Cupom</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p) => (
                                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-gray-600">
                                        <div className="font-bold text-gray-900">{p.name}</div>
                                        {p.category && (
                                            <div className="text-xs text-indigo-600 font-semibold mt-1">
                                                {p.category.name}
                                            </div>
                                        )}
                                        {p.addonGroups && p.addonGroups.length > 0 && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                <span className="font-semibold text-gray-700">Adicionais:</span>{" "}
                                                {p.addonGroups.map(g => `${g.name} (${g.addons.length})`).join(", ")}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        <span className={`px-2 py-1 rounded-full text-xs ${p.type === 'RECURRING' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {p.type === 'RECURRING' ? 'Assinatura' : 'Único'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        <div className="flex flex-col">
                                            {p.salePrice ? (
                                                <>
                                                    <span className="text-xs text-red-500 line-through">R$ {p.price.toFixed(2)}</span>
                                                    <span className="font-bold text-green-600">R$ {p.salePrice.toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span>R$ {p.price.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        <span className={`px-2 py-1 rounded-full text-xs ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.stock} un
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs ${p.allowCoupons !== false ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {p.allowCoupons !== false ? 'Sim' : 'Não'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 mr-3">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Paginação */}
                    {products.length > itemsPerPage && (
                        <div className="flex justify-between items-center py-4 px-2 border-t border-gray-100">
                            <span className="text-sm text-gray-500">
                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, products.length)} de {products.length} produtos
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(products.length / itemsPerPage)))}
                                    disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                                    className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            {editingProduct ? "Editar Produto" : "Novo Produto"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Ex: X-Salada Especial"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cobrança</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                    >
                                        <option value="SINGLE">Cobrança Única</option>
                                        <option value="RECURRING">Assinatura</option>
                                    </select>
                                </div>
                                {formData.type === 'RECURRING' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
                                        <select
                                            value={formData.billingPeriod}
                                            onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                        >
                                            <option value="WEEKLY">Semanal</option>
                                            <option value="MONTHLY">Mensal</option>
                                            <option value="QUARTERLY">Trimestral</option>
                                            <option value="YEARLY">Anual</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Original (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Oferta (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.salePrice}
                                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 border-green-200 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque / Qtd</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none text-sm"
                                    placeholder="Detalhes do produto, ingredientes, etc..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (Foto)</label>
                                    <input
                                        type="text"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <input
                                    type="checkbox"
                                    id="allowCoupons"
                                    checked={formData.allowCoupons}
                                    onChange={(e) => setFormData({ ...formData, allowCoupons: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <label htmlFor="allowCoupons" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Permitir uso de cupons neste produto
                                </label>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <h4 className="text-md font-bold text-gray-800 mb-2">Categoria</h4>
                                <input 
                                    type="text" 
                                    value={formData.categoryName} 
                                    onChange={(e) => setFormData({...formData, categoryName: e.target.value})} 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 text-sm" 
                                    placeholder="Ex: Hambúrgueres, Bebidas..." 
                                />
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-md font-bold text-gray-800">Grupos de Adicionais</h4>
                                    <button type="button" onClick={() => {
                                        setFormData({
                                            ...formData, 
                                            addonGroups: [...formData.addonGroups, { name: "", minSelect: 0, maxSelect: 1, addons: [] }]
                                        })
                                    }} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 font-medium">
                                        + Novo Grupo
                                    </button>
                                </div>
                                
                                {formData.addonGroups.map((group, gIndex) => (
                                    <div key={gIndex} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <input 
                                                type="text" 
                                                value={group.name} 
                                                onChange={(e) => {
                                                    const newGroups = [...formData.addonGroups];
                                                    newGroups[gIndex].name = e.target.value;
                                                    setFormData({...formData, addonGroups: newGroups});
                                                }} 
                                                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 mr-2" 
                                                placeholder="Nome do grupo (Ex: Escolha o ponto)" 
                                            />
                                            <button type="button" onClick={() => {
                                                const newGroups = formData.addonGroups.filter((_, i) => i !== gIndex);
                                                setFormData({...formData, addonGroups: newGroups});
                                            }} className="text-red-500 hover:text-red-700"><Trash className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold">Mínimo Permitido</label>
                                                <input type="number" value={group.minSelect} onChange={e => {
                                                    const newGroups = [...formData.addonGroups];
                                                    newGroups[gIndex].minSelect = parseInt(e.target.value) || 0;
                                                    setFormData({...formData, addonGroups: newGroups});
                                                }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold">Máximo Permitido</label>
                                                <input type="number" value={group.maxSelect} onChange={e => {
                                                    const newGroups = [...formData.addonGroups];
                                                    newGroups[gIndex].maxSelect = parseInt(e.target.value) || 1;
                                                    setFormData({...formData, addonGroups: newGroups});
                                                }} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                                            {group.addons.map((addon, aIndex) => (
                                                <div key={aIndex} className="flex gap-2 items-center">
                                                    <input type="text" value={addon.name} onChange={e => {
                                                        const newGroups = [...formData.addonGroups];
                                                        newGroups[gIndex].addons[aIndex].name = e.target.value;
                                                        setFormData({...formData, addonGroups: newGroups});
                                                    }} className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs" placeholder="Nome (Ex: Bacon)" />
                                                    <div className="relative w-24">
                                                        <span className="absolute left-2 top-1.5 text-xs text-gray-400">R$</span>
                                                        <input type="number" step="0.01" value={addon.price} onChange={e => {
                                                            const newGroups = [...formData.addonGroups];
                                                            newGroups[gIndex].addons[aIndex].price = parseFloat(e.target.value) || 0;
                                                            setFormData({...formData, addonGroups: newGroups});
                                                        }} className="w-full border border-gray-300 rounded pl-6 pr-2 py-1 text-xs" placeholder="0.00" />
                                                    </div>
                                                    <button type="button" onClick={() => {
                                                        const newGroups = [...formData.addonGroups];
                                                        newGroups[gIndex].addons = newGroups[gIndex].addons.filter((_, i) => i !== aIndex);
                                                        setFormData({...formData, addonGroups: newGroups});
                                                    }} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => {
                                                const newGroups = [...formData.addonGroups];
                                                newGroups[gIndex].addons.push({ name: "", price: 0 });
                                                setFormData({...formData, addonGroups: newGroups});
                                            }} className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
                                                <Plus className="w-3 h-3" /> Adicionar Ingrediente
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                                >
                                    Salvar Produto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Magic Import Modal */}
            {isMagicModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
                        <button
                            onClick={() => setIsMagicModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            disabled={isImporting}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                            ✨ Importar Cardápio Mágico
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Cole o cardápio do seu restaurante (mesmo que seja um texto bagunçado de WhatsApp ou PDF copiado). A Inteligência Artificial vai organizar categorias, produtos, preços e adicionais automaticamente!
                        </p>

                        <div className="space-y-4">
                            <textarea
                                value={magicText}
                                onChange={(e) => setMagicText(e.target.value)}
                                disabled={isImporting}
                                className="w-full h-64 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder={`Ex:\nHAMBÚRGUERES\nX-Salada - R$ 25,00\n(Acompanha pão, carne, queijo, alface, tomate)\n\nAdicionais:\nBacon - R$ 5,00\nOvo - R$ 2,00\n\nBEBIDAS\nCoca-Cola Lata - R$ 6,00`}
                            />

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsMagicModalOpen(false)}
                                    disabled={isImporting}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleMagicImport}
                                    disabled={isImporting || !magicText}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isImporting ? "Importando (pode demorar um pouco)..." : "Começar Mágica ✨"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
