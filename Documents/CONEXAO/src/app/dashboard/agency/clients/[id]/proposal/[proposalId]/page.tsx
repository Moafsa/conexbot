"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Loader2, Download, Save, Plus, Trash2, FileSignature, CheckCircle2
} from "lucide-react";

type ServiceItem = {
    name: string;
    description?: string;
    recurring: boolean;
    setupPrice: number | null;
    monthlyPrice: number | null;
};
type DeliverableGroup = { category: string; items: string[] };
type TimelineStage = { stage: string; days: string; expectedResult: string };

export default function ClientProposalPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;
    const proposalId = params.proposalId as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const [title, setTitle] = useState("");
    const [workingWell, setWorkingWell] = useState<string[]>([]);
    const [losingReach, setLosingReach] = useState<string[]>([]);
    const [deliverables, setDeliverables] = useState<DeliverableGroup[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [timeline, setTimeline] = useState<TimelineStage[]>([]);
    const [nextSteps, setNextSteps] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/agency/clients/${clientId}/proposal/${proposalId}`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || "Erro ao carregar a proposta.");
                    return;
                }
                setTitle(data.title || "");
                setWorkingWell(data.diagnosis?.workingWell || []);
                setLosingReach(data.diagnosis?.losingReach || []);
                setDeliverables(Array.isArray(data.deliverables) ? data.deliverables : []);
                setServices(
                    Array.isArray(data.services)
                        ? data.services.map((s: any) => ({
                              name: s.name || "",
                              description: s.description || "",
                              recurring: !!s.recurring,
                              setupPrice: s.setupPrice ?? null,
                              monthlyPrice: s.monthlyPrice ?? null
                          }))
                        : []
                );
                setTimeline(Array.isArray(data.timeline) ? data.timeline : []);
                setNextSteps(Array.isArray(data.nextSteps) ? data.nextSteps : []);
            } catch (e) {
                setError("Erro ao se conectar ao servidor.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [clientId, proposalId]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const res = await fetch(`/api/agency/clients/${clientId}/proposal/${proposalId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    diagnosis: { workingWell, losingReach },
                    deliverables,
                    services,
                    timeline,
                    nextSteps
                })
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Erro ao salvar a proposta.");
                return;
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            setError("Erro ao se conectar ao servidor.");
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = async () => {
        await handleSave();
        window.open(`/api/agency/clients/${clientId}/proposal/${proposalId}/pdf`, "_blank");
    };

    // ─── Helpers genéricos de lista editável ───────────────────────────────
    const StringList = ({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) => (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        value={item}
                        onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
                        placeholder={placeholder}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-purple-500"
                    />
                    <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-2 text-gray-500 hover:text-red-400">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button
                onClick={() => onChange([...items, ""])}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
            >
                <Plus size={12} /> Adicionar item
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    if (error && loading === false && !title) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white">
                <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-8 max-w-md text-center space-y-4">
                    <p className="text-gray-300">{error}</p>
                    <button onClick={() => router.back()} className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10">
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/agency/clients/${clientId}/audit`)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <FileSignature size={22} className="text-purple-400" />
                            Editar Proposta Comercial
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Revise o rascunho gerado pela IA, ajuste os valores e baixe o PDF para enviar ao cliente.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all text-sm flex items-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Save size={16} />}
                        {saved ? "Salvo!" : "Salvar"}
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        className="px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold transition-all text-sm flex items-center gap-2 shadow-xl shadow-purple-500/20"
                    >
                        <Download size={16} />
                        Baixar PDF
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl p-3">{error}</div>
            )}

            <div className="max-w-4xl space-y-8">
                {/* Título */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Título da Proposta</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-xl font-bold text-white outline-none focus:border-purple-500"
                    />
                </div>

                {/* Diagnóstico */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                    <h3 className="font-bold text-lg">1. Diagnóstico</h3>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">O que já funciona bem</p>
                        <StringList items={workingWell} onChange={setWorkingWell} placeholder="Ex: Identidade visual forte e consolidada" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Onde está perdendo alcance</p>
                        <StringList items={losingReach} onChange={setLosingReach} placeholder="Ex: Agendamento depende 100% de resposta manual" />
                    </div>
                </div>

                {/* Entregáveis */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">2. O que vamos entregar</h3>
                        <button
                            onClick={() => setDeliverables([...deliverables, { category: "", items: [] }])}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
                        >
                            <Plus size={12} /> Novo grupo
                        </button>
                    </div>
                    {deliverables.map((group, gi) => (
                        <div key={gi} className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    value={group.category}
                                    onChange={(e) =>
                                        setDeliverables(deliverables.map((g, j) => (j === gi ? { ...g, category: e.target.value } : g)))
                                    }
                                    placeholder="Categoria, ex: Site institucional com agendamento"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm font-bold text-white outline-none focus:border-purple-500"
                                />
                                <button onClick={() => setDeliverables(deliverables.filter((_, j) => j !== gi))} className="p-2 text-gray-500 hover:text-red-400">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <StringList
                                items={group.items}
                                onChange={(items) => setDeliverables(deliverables.map((g, j) => (j === gi ? { ...g, items } : g)))}
                                placeholder="Item específico entregue"
                            />
                        </div>
                    ))}
                </div>

                {/* Investimento */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">3. Investimento</h3>
                        <button
                            onClick={() =>
                                setServices([...services, { name: "", description: "", recurring: false, setupPrice: null, monthlyPrice: null }])
                            }
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
                        >
                            <Plus size={12} /> Novo serviço
                        </button>
                    </div>
                    <div className="space-y-3">
                        {services.map((s, i) => (
                            <div key={i} className="bg-black/20 border border-white/5 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                <input
                                    value={s.name}
                                    onChange={(e) => setServices(services.map((v, j) => (j === i ? { ...v, name: e.target.value } : v)))}
                                    placeholder="Nome do serviço"
                                    className="md:col-span-4 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-purple-500"
                                />
                                <label className="md:col-span-2 flex items-center gap-2 text-xs text-gray-400">
                                    <input
                                        type="checkbox"
                                        checked={s.recurring}
                                        onChange={(e) => setServices(services.map((v, j) => (j === i ? { ...v, recurring: e.target.checked } : v)))}
                                    />
                                    Mensalidade
                                </label>
                                {!s.recurring ? (
                                    <div className="md:col-span-3">
                                        <span className="text-[10px] text-gray-500 block mb-1">Implantação (R$)</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={s.setupPrice ?? ""}
                                            onChange={(e) =>
                                                setServices(
                                                    services.map((v, j) => (j === i ? { ...v, setupPrice: e.target.value === "" ? null : parseFloat(e.target.value) } : v))
                                                )
                                            }
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-purple-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="md:col-span-3">
                                        <span className="text-[10px] text-gray-500 block mb-1">Mensal (R$/mês)</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={s.monthlyPrice ?? ""}
                                            onChange={(e) =>
                                                setServices(
                                                    services.map((v, j) => (j === i ? { ...v, monthlyPrice: e.target.value === "" ? null : parseFloat(e.target.value) } : v))
                                                )
                                            }
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-purple-500"
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={() => setServices(services.filter((_, j) => j !== i))}
                                    className="md:col-span-1 p-2 text-gray-500 hover:text-red-400 justify-self-end"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <input
                                    value={s.description}
                                    onChange={(e) => setServices(services.map((v, j) => (j === i ? { ...v, description: e.target.value } : v)))}
                                    placeholder="Descrição breve (opcional)"
                                    className="md:col-span-12 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-gray-400 outline-none focus:border-purple-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cronograma */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">4. Cronograma</h3>
                        <button
                            onClick={() => setTimeline([...timeline, { stage: "", days: "", expectedResult: "" }])}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
                        >
                            <Plus size={12} /> Nova etapa
                        </button>
                    </div>
                    <div className="space-y-3">
                        {timeline.map((t, i) => (
                            <div key={i} className="bg-black/20 border border-white/5 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                                <input
                                    value={t.stage}
                                    onChange={(e) => setTimeline(timeline.map((v, j) => (j === i ? { ...v, stage: e.target.value } : v)))}
                                    placeholder="Etapa"
                                    className="md:col-span-4 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-purple-500"
                                />
                                <input
                                    value={t.days}
                                    onChange={(e) => setTimeline(timeline.map((v, j) => (j === i ? { ...v, days: e.target.value } : v)))}
                                    placeholder="Prazo, ex: 5 a 7 dias"
                                    className="md:col-span-3 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-purple-500"
                                />
                                <input
                                    value={t.expectedResult}
                                    onChange={(e) => setTimeline(timeline.map((v, j) => (j === i ? { ...v, expectedResult: e.target.value } : v)))}
                                    placeholder="Resultado esperado"
                                    className="md:col-span-4 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-purple-500"
                                />
                                <button
                                    onClick={() => setTimeline(timeline.filter((_, j) => j !== i))}
                                    className="md:col-span-1 p-2 text-gray-500 hover:text-red-400 justify-self-end"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Próximos Passos */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                    <h3 className="font-bold text-lg">5. Próximos Passos</h3>
                    <StringList items={nextSteps} onChange={setNextSteps} placeholder="Ex: Aprovação desta proposta." />
                </div>
            </div>
        </div>
    );
}
