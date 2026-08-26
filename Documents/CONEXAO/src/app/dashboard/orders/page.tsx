"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw, Package, Clock, CheckCircle2, XCircle, Truck, AlertCircle, SlidersHorizontal, X } from "lucide-react";
import { cleanAddress } from "@/lib/phone-utils";

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING:     { label: "Pendente",    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",    icon: <Clock size={10} /> },
    PAID:        { label: "Pago",        color: "bg-blue-500/15 text-blue-400 border-blue-500/30",       icon: <CheckCircle2 size={10} /> },
    IN_DELIVERY: { label: "Em Entrega",  color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: <Truck size={10} /> },
    DELIVERED:   { label: "Entregue",    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 size={10} /> },
    RECEIVED:    { label: "Recebido",    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 size={10} /> },
    CANCELLED:   { label: "Cancelado",   color: "bg-red-500/15 text-red-400 border-red-500/30",          icon: <XCircle size={10} /> },
};

const STATUS_OPTIONS = ["", "PENDING", "PAID", "IN_DELIVERY", "DELIVERED", "RECEIVED", "CANCELLED"];

function fmt(d: string) {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
        " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    // Filters
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "20" });
            if (search)  params.set("search",  search);
            if (status)  params.set("status",  status);
            if (from)    params.set("from",    from);
            if (to)      params.set("to",      to);
            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            setOrders(data.orders || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setStatusCounts(data.statusCounts || {});
        } finally {
            setLoading(false);
        }
    }, [page, search, status, from, to]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    function applySearch() { setSearch(searchInput); setPage(1); }
    function clearFilters() { setSearch(""); setSearchInput(""); setStatus(""); setFrom(""); setTo(""); setPage(1); }
    const hasActiveFilters = !!(search || status || from || to);

    const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-[#030014] text-white p-4 md:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Pedidos</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Histórico completo de pedidos com filtros e status</p>
                </div>
                <button onClick={fetchOrders} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition border border-white/8">
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Status summary chips */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => { setStatus(""); setPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${!status ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/8 text-gray-500 hover:text-white"}`}
                >
                    <Package size={11} /> Todos <span className="ml-1 opacity-70">{totalOrders}</span>
                </button>
                {Object.entries(STATUS_MAP).map(([key, val]) => {
                    const count = statusCounts[key] || 0;
                    if (!count) return null;
                    return (
                        <button
                            key={key}
                            onClick={() => { setStatus(key); setPage(1); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${status === key ? val.color + " opacity-100" : "bg-white/5 border-white/8 text-gray-500 hover:text-white"}`}
                        >
                            {val.icon} {val.label} <span className="ml-1 opacity-70">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search + Filters bar */}
            <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && applySearch()}
                            placeholder="Buscar por cliente, telefone, endereço..."
                            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]"
                        />
                    </div>
                    <button onClick={applySearch} className="px-4 py-2 bg-[#6366f1] hover:bg-[#5253cc] text-white text-sm font-bold rounded-xl transition">
                        Buscar
                    </button>
                </div>
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition ${showFilters || hasActiveFilters ? "bg-[#6366f1]/20 border-[#6366f1]/40 text-[#a5b4fc]" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"}`}
                >
                    <SlidersHorizontal size={14} /> Filtros {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] inline-block" />}
                </button>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition">
                        <X size={14} />
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Status</label>
                        <select
                            value={status}
                            onChange={e => { setStatus(e.target.value); setPage(1); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                        >
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s ? (STATUS_MAP[s]?.label || s) : "Todos"}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Data início</label>
                        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Data fim</label>
                        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]" />
                    </div>
                </div>
            )}

            {/* Orders table */}
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <RefreshCw size={18} className="animate-spin mr-2" /> Carregando...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                        <Package size={32} className="mb-3 opacity-30" />
                        <p className="font-semibold">Nenhum pedido encontrado</p>
                        {hasActiveFilters && <p className="text-sm mt-1">Tente remover os filtros</p>}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-gray-600">
                                        <th className="text-left px-4 py-3 font-bold">Pedido</th>
                                        <th className="text-left px-4 py-3 font-bold">Cliente</th>
                                        <th className="text-left px-4 py-3 font-bold">Itens</th>
                                        <th className="text-left px-4 py-3 font-bold">Endereço</th>
                                        <th className="text-left px-4 py-3 font-bold">Observações</th>
                                        <th className="text-right px-4 py-3 font-bold">Total</th>
                                        <th className="text-left px-4 py-3 font-bold">Entregador</th>
                                        <th className="text-left px-4 py-3 font-bold">Status</th>
                                        <th className="text-left px-4 py-3 font-bold">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {orders.map(order => {
                                        const st = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-500/15 text-gray-400 border-gray-500/30", icon: <AlertCircle size={10} /> };
                                        const itemsSummary = order.items?.length > 0
                                            ? order.items.map((i: any) => `${i.product?.name || "?"} x${i.quantity}`).join(", ")
                                            : "—";
                                        return (
                                            <tr key={order.id} className="hover:bg-white/3 transition">
                                                <td className="px-4 py-3">
                                                    <code className="text-[10px] text-gray-500 font-mono">#{order.id.substring(0, 8)}</code>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-white truncate max-w-[120px]">{order.contact?.name || "—"}</p>
                                                    <p className="text-[10px] text-gray-600 font-mono">{order.contact?.phone}</p>
                                                    <p className="text-[10px] text-gray-600">{order.bot?.name}</p>
                                                </td>
                                                <td className="px-4 py-3 max-w-[150px]">
                                                    <p className="truncate text-gray-300">{itemsSummary}</p>
                                                </td>
                                                <td className="px-4 py-3 max-w-[160px]">
                                                    <p className="truncate text-gray-300">{cleanAddress(order.address || "") || "—"}</p>
                                                </td>
                                                <td className="px-4 py-3 max-w-[140px]">
                                                    {order.notes ? (
                                                        <p className="truncate text-amber-300 text-[10px]">📝 {order.notes}</p>
                                                    ) : <span className="text-gray-700">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-bold text-amber-400 font-mono">R$ {Number(order.totalAmount).toFixed(2)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.driver
                                                        ? <p className="font-medium text-gray-300 truncate max-w-[100px]">{order.driver.name || order.driver.phone}</p>
                                                        : <span className="text-gray-700">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${st.color}`}>
                                                        {st.icon} {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(order.createdAt)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-white/5">
                            {orders.map(order => {
                                const st = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-500/15 text-gray-400 border-gray-500/30", icon: <AlertCircle size={10} /> };
                                return (
                                    <div key={order.id} className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <code className="text-[10px] text-gray-600 font-mono">#{order.id.substring(0, 8)}</code>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${st.color}`}>
                                                {st.icon} {st.label}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-white text-sm">{order.contact?.name || order.contact?.phone || "—"}</p>
                                                <p className="text-xs text-gray-500">{order.bot?.name}</p>
                                            </div>
                                            <span className="font-bold text-amber-400 font-mono text-sm shrink-0">R$ {Number(order.totalAmount).toFixed(2)}</span>
                                        </div>
                                        {order.items?.length > 0 && (
                                            <p className="text-xs text-gray-400">{order.items.map((i: any) => `${i.product?.name || "?"} x${i.quantity}`).join(", ")}</p>
                                        )}
                                        {order.address && <p className="text-xs text-gray-500 truncate">📍 {cleanAddress(order.address)}</p>}
                                        {order.notes && <p className="text-xs text-amber-300">📝 {order.notes}</p>}
                                        {order.driver && <p className="text-xs text-gray-500">🚚 {order.driver.name || order.driver.phone}</p>}
                                        <p className="text-[10px] text-gray-700">{fmt(order.createdAt)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{total} pedidos · página {page} de {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white disabled:opacity-30 transition"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pg = page <= 3 ? i + 1 : page + i - 2;
                            if (pg < 1 || pg > totalPages) return null;
                            return (
                                <button
                                    key={pg}
                                    onClick={() => setPage(pg)}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition ${pg === page ? "bg-[#6366f1] text-white" : "bg-white/5 border border-white/8 text-gray-400 hover:text-white"}`}
                                >
                                    {pg}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2 rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white disabled:opacity-30 transition"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
