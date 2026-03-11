"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Edit, Ticket, X, Calendar as CalendarIcon, Hash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Coupon {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    active: boolean;
    expiresAt?: string | null;
    usageLimit?: number | null;
    usedCount: number;
}

export function CouponManager({ botId }: { botId: string }) {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: "",
        type: "PERCENTAGE",
        value: "",
        expiresAt: "",
        usageLimit: "",
        active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, [botId]);

    async function fetchCoupons() {
        try {
            const res = await fetch(`/api/coupons?botId=${botId}`);
            if (res.ok) {
                const data = await res.json();
                setCoupons(data);
            }
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const url = editingCoupon
                ? `/api/coupons/${editingCoupon.id}`
                : "/api/coupons";
            const method = editingCoupon ? "PUT" : "POST";

            const body = {
                ...formData,
                botId,
                value: parseFloat(formData.value),
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                expiresAt: formData.expiresAt || null,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchCoupons();
            } else {
                const error = await res.json();
                alert(error.error || "Erro ao salvar cupom");
            }
        } catch (error) {
            console.error("Error saving coupon", error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
        try {
            await fetch(`/api/coupons/${id}`, { method: "DELETE" });
            fetchCoupons();
        } catch (error) {
            console.error("Error deleting coupon", error);
        }
    }

    async function toggleActive(coupon: Coupon) {
        try {
            await fetch(`/api/coupons/${coupon.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !coupon.active }),
            });
            fetchCoupons();
        } catch (error) {
            console.error("Error toggling coupon status", error);
        }
    }

    function openEdit(coupon: Coupon) {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value.toString(),
            expiresAt: coupon.expiresAt ? format(new Date(coupon.expiresAt), "yyyy-MM-dd") : "",
            usageLimit: coupon.usageLimit?.toString() || "",
            active: coupon.active
        });
        setIsModalOpen(true);
    }

    function resetForm() {
        setEditingCoupon(null);
        setFormData({
            code: "",
            type: "PERCENTAGE",
            value: "",
            expiresAt: "",
            usageLimit: "",
            active: true
        });
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-indigo-600" />
                    Cupons de Desconto
                </h2>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Novo Cupom
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500 text-center py-4">Carregando cupons...</p>
            ) : coupons.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">Nenhum cupom cadastrado.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Crie o primeiro!
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm">Código</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm">Desconto</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm">Validade</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm">Uso</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm">Status</th>
                                <th className="py-3 px-4 text-gray-600 font-medium text-sm text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((c) => (
                                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-bold text-indigo-600">{c.code}</code>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        {c.type === 'PERCENTAGE' ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        {c.expiresAt ? format(new Date(c.expiresAt), "dd/MM/yy", { locale: ptBR }) : 'Permanente'}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        {c.usedCount} / {c.usageLimit || '∞'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <button 
                                            onClick={() => toggleActive(c)}
                                            className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            {c.active ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 mr-3">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700">
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

                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-indigo-600" />
                            {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código do Cupom</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
                                    placeholder="Ex: PROMO10"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                    >
                                        <option value="PERCENTAGE">Porcentagem (%)</option>
                                        <option value="FIXED">Valor Fixo (R$)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder={formData.type === 'PERCENTAGE' ? "10" : "0.00"}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3" /> Validade
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                        <Hash className="w-3 h-3" /> Limite de Uso
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                        placeholder="Ilimitado"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="coupon-active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="coupon-active" className="text-sm font-medium text-gray-700">Cupom Ativo</label>
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
                                    Salvar Cupom
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
