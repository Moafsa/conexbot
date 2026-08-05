"use client";

import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Users, MessageSquare, ShoppingBag, DollarSign, Sparkles } from "lucide-react";

type AttributionRow = {
    key: string;
    campaignId: string | null;
    campaignName: string | null;
    utmSource: string | null;
    entrySource: string | null;
    leads: number;
    conversations: number;
    orders: number;
    revenue: number;
    spend: number;
    cpl: number | null;
    roas: number | null;
};

function fmtMoney(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const RANGE_OPTIONS = [
    { label: "7 dias", value: 7 },
    { label: "30 dias", value: 30 },
    { label: "90 dias", value: 90 }
];

export function AttributionTab({ selectedClientId }: any) {
    const [rows, setRows] = useState<AttributionRow[]>([]);
    const [totals, setTotals] = useState({ leads: 0, conversations: 0, orders: 0, revenue: 0, spend: 0 });
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        const fetchAttribution = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedClientId) params.set("clientId", selectedClientId);
                params.set("days", String(days));
                const res = await fetch(`/api/marketing/attribution?${params.toString()}`);
                const d = await res.json();
                if (res.ok) {
                    setRows(Array.isArray(d.rows) ? d.rows : []);
                    setTotals(d.totals || { leads: 0, conversations: 0, orders: 0, revenue: 0, spend: 0 });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttribution();
    }, [selectedClientId, days]);

    const avgCpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
    const avgRoas = totals.spend > 0 ? totals.revenue / totals.spend : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-400" />
                        ROI & Atribuição de Leads
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Quais campanhas realmente geram leads, conversas e vendas — não só cliques.
                    </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                    {RANGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setDays(opt.value)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                days === opt.value ? "bg-emerald-500 text-black" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 flex items-center gap-1">
                        <Users size={12} /> Leads
                    </p>
                    <p className="text-2xl font-bold text-white">{totals.leads}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 flex items-center gap-1">
                        <MessageSquare size={12} /> Conversas
                    </p>
                    <p className="text-2xl font-bold text-white">{totals.conversations}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 flex items-center gap-1">
                        <ShoppingBag size={12} /> Pedidos
                    </p>
                    <p className="text-2xl font-bold text-white">{totals.orders}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 flex items-center gap-1">
                        <DollarSign size={12} /> Receita Atribuída
                    </p>
                    <p className="text-2xl font-bold text-emerald-400">{fmtMoney(totals.revenue)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 flex items-center gap-1">
                        <Target size={12} /> ROAS Médio
                    </p>
                    <p className="text-2xl font-bold text-white">{avgRoas !== null ? `${avgRoas.toFixed(2)}x` : "—"}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-sm text-gray-300">Desempenho por Campanha / Origem</h4>
                    {totals.leads > 0 && (
                        <p className="text-xs text-gray-500">
                            CPL médio: <span className="text-white font-bold">{fmtMoney(avgCpl)}</span>
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Sparkles className="animate-spin text-emerald-500" size={28} />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10">
                        <p className="text-gray-500">Nenhum lead com origem de campanha/UTM identificada no período.</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Leads chegam com atribuição quando vêm de anúncios de clique-para-WhatsApp, Instagram Ads ou links com UTM.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-sm min-w-[760px]">
                            <thead>
                                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                                    <th className="px-2 py-3 font-bold">Campanha / Origem</th>
                                    <th className="px-2 py-3 font-bold text-right">Leads</th>
                                    <th className="px-2 py-3 font-bold text-right">Conversas</th>
                                    <th className="px-2 py-3 font-bold text-right">Pedidos</th>
                                    <th className="px-2 py-3 font-bold text-right">Receita</th>
                                    <th className="px-2 py-3 font-bold text-right">Gasto</th>
                                    <th className="px-2 py-3 font-bold text-right">CPL</th>
                                    <th className="px-2 py-3 font-bold text-right">ROAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.key} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                                        <td className="px-2 py-3">
                                            <p className="font-bold text-gray-200 truncate max-w-[220px]">
                                                {r.campaignName || r.utmSource || "Desconhecido"}
                                            </p>
                                            {r.entrySource && <p className="text-[10px] text-gray-500">{r.entrySource}</p>}
                                        </td>
                                        <td className="px-2 py-3 text-right text-gray-300">{r.leads}</td>
                                        <td className="px-2 py-3 text-right text-gray-300">{r.conversations}</td>
                                        <td className="px-2 py-3 text-right text-gray-300">{r.orders}</td>
                                        <td className="px-2 py-3 text-right text-emerald-400 font-bold">{fmtMoney(r.revenue)}</td>
                                        <td className="px-2 py-3 text-right text-gray-300">{r.spend > 0 ? fmtMoney(r.spend) : "—"}</td>
                                        <td className="px-2 py-3 text-right text-gray-300">{r.cpl !== null ? fmtMoney(r.cpl) : "—"}</td>
                                        <td className="px-2 py-3 text-right font-bold">
                                            {r.roas !== null ? (
                                                <span className={r.roas >= 1 ? "text-emerald-400" : "text-amber-400"}>{r.roas.toFixed(2)}x</span>
                                            ) : (
                                                <span className="text-gray-500">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="text-[11px] text-gray-500 mt-4">
                    Gasto por campanha combina histórico persistido (snapshot diário) com dados ao vivo da Meta/Google Ads para os últimos 30 dias.
                    Períodos mais antigos dependem do histórico ter sido capturado dia a dia.
                </p>
            </div>
        </div>
    );
}
