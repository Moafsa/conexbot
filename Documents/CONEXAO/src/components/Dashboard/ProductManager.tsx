"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Edit, Package, X } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    description?: string;
    stock: number;
    sku?: string;
    active: boolean;
}

export function ProductManager({ botId }: { botId: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        stock: "0",
        sku: "",
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
                stock: parseInt(formData.stock),
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingProduct(null);
                setFormData({ name: "", price: "", description: "", stock: "0", sku: "" });
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
            description: product.description || "",
            stock: product.stock.toString(),
            sku: product.sku || "",
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
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setFormData({ name: "", price: "", description: "", stock: "0", sku: "" });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                </button>
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
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-left">Preço</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-left">Estoque</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                                    <td className="py-3 px-4 text-gray-600">R$ {p.price.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-gray-600">
                                        <span className={`px-2 py-1 rounded-full text-xs ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.stock} un
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
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Ex: X-Salada Especial"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                                    placeholder="Detalhes do produto, ingredientes, etc..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                >
                                    Salvar Produto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
