"use client";

import React, { useMemo, useState } from "react";

type DailyPoint = { date: string; spend: number; impressions: number; clicks: number };

interface PerformanceChartProps {
    metaDaily?: DailyPoint[];
    googleDaily?: DailyPoint[];
}

function formatDay(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function PerformanceChart({ metaDaily = [], googleDaily = [] }: PerformanceChartProps) {
    const [metric, setMetric] = useState<"spend" | "impressions" | "clicks">("spend");

    const merged = useMemo(() => {
        const byDate: Record<string, { date: string; meta: number; google: number }> = {};
        for (const p of metaDaily) {
            byDate[p.date] = byDate[p.date] || { date: p.date, meta: 0, google: 0 };
            byDate[p.date].meta = p[metric];
        }
        for (const p of googleDaily) {
            byDate[p.date] = byDate[p.date] || { date: p.date, meta: 0, google: 0 };
            byDate[p.date].google = p[metric];
        }
        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }, [metaDaily, googleDaily, metric]);

    if (metaDaily.length === 0 && googleDaily.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-gray-500 italic text-sm text-center px-6">
                Sem dados de campanhas nos últimos 30 dias. Conecte o Meta Ads e/ou Google Ads na aba de Integrações para ver o desempenho aqui.
            </div>
        );
    }

    const width = 100; // percentage-based viewBox, scales with container
    const height = 240;
    const padding = 24;
    const maxVal = Math.max(1, ...merged.map((d) => Math.max(d.meta, d.google)));
    const stepX = merged.length > 1 ? (width - padding) / (merged.length - 1) : 0;

    const toPoints = (key: "meta" | "google") =>
        merged
            .map((d, i) => {
                const x = padding / 2 + i * stepX;
                const y = height - padding - (d[key] / maxVal) * (height - padding * 1.5);
                return `${x},${y}`;
            })
            .join(" ");

    const metricLabel = { spend: "Gasto (R$)", impressions: "Impressões", clicks: "Cliques" }[metric];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Meta Ads
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Google Ads
                    </span>
                </div>
                <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                    {(["spend", "impressions", "clicks"] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                metric === m ? "bg-emerald-500 text-black" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            {{ spend: "Gasto", impressions: "Impressões", clicks: "Cliques" }[m]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border border-white/10 rounded-2xl p-4 bg-black/20">
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-[220px]">
                    {/* grid lines */}
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                        <line
                            key={f}
                            x1={padding / 2}
                            x2={width - padding / 2}
                            y1={height - padding - f * (height - padding * 1.5)}
                            y2={height - padding - f * (height - padding * 1.5)}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="0.3"
                        />
                    ))}
                    {googleDaily.length > 0 && (
                        <polyline points={toPoints("google")} fill="none" stroke="#ef4444" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                    )}
                    {metaDaily.length > 0 && (
                        <polyline points={toPoints("meta")} fill="none" stroke="#3b82f6" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                    )}
                </svg>
                <div className="flex justify-between text-[10px] text-gray-500 mt-2 px-1">
                    {merged.length > 0 && (
                        <>
                            <span>{formatDay(merged[0].date)}</span>
                            {merged.length > 2 && <span>{formatDay(merged[Math.floor(merged.length / 2)].date)}</span>}
                            <span>{formatDay(merged[merged.length - 1].date)}</span>
                        </>
                    )}
                </div>
            </div>
            <p className="text-[11px] text-gray-500">{metricLabel} por dia, últimos 30 dias.</p>
        </div>
    );
}
