"use client";
// aria-label placeholder

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Sparkles, AlertTriangle, ShieldCheck, Zap,
    TrendingUp, FileText, Printer, Award, CheckCircle2, ChevronRight, Loader2, RefreshCw
} from "lucide-react";

export default function ClientAuditPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    const [client, setClient] = useState<any>(null);
    const [audit, setAudit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [auditing, setAuditing] = useState(false);
    const [auditStep, setAuditStep] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Mensagens dinâmicas de processamento da auditoria
    const AUDIT_STEPS = [
        "Iniciando raspagem e análise estrutural do site do cliente...",
        "Gary Halbert está avaliando o headline e o poder de conversão da copy...",
        "Marty Neumeier está analisando o posicionamento de marca e a diferenciação contra a concorrência...",
        "Pedro Sobral está calculando a dispersão de tráfego, criativos e distribuição de canais...",
        "Sean Ellis está auditando a retenção de dados, analytics e funil de conversão...",
        "Alex Hormozi está desenhando uma oferta irresistível (Grand Slam Offer) com bônus e garantia...",
        "Consolidadando as métricas e gerando a trilha de missões gamificada..."
    ];

    useEffect(() => {
        refreshData();
    }, [clientId]);

    // Loop de mensagens do loading do Raio-X
    useEffect(() => {
        let interval: any;
        if (auditing) {
            setAuditStep(0);
            interval = setInterval(() => {
                setAuditStep(s => {
                    if (s < AUDIT_STEPS.length - 1) return s + 1;
                    return s;
                });
            }, 4500);
        }
        return () => clearInterval(interval);
    }, [auditing]);

    const refreshData = async () => {
        setLoading(true);
        try {
            // Buscar dados do cliente
            const clientRes = await fetch(`/api/agency/clients/${clientId}`);
            const clientData = await clientRes.json();
            if (clientData.error) {
                setError(clientData.error);
                setLoading(false);
                return;
            }
            setClient(clientData);

            // Carregar última auditoria se houver
            const audits = clientData.clientAudits;
            if (Array.isArray(audits) && audits.length > 0) {
                setAudit(audits[0]); // Pega o mais recente
            }
        } catch (e) {
            setError("Erro ao se conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleRunAudit = async () => {
        setAuditing(true);
        setAuditStep(0);
        setError(null);

        try {
            const res = await fetch(`/api/agency/clients/${clientId}/audit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (res.ok && data.success && data.jobId) {
                pollAuditStatus(data.jobId);
            } else {
                setError(data.error || "Ocorreu um erro ao iniciar a auditoria.");
                setAuditing(false);
            }
        } catch (e) {
            setError("Erro ao se conectar ao servidor durante o início do Raio-X.");
            setAuditing(false);
        }
    };

    const pollAuditStatus = (jobId: string) => {
        let attempts = 0;
        const maxAttempts = 60; // ~3 minutes at 3s intervals

        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                setError('A auditoria está demorando mais que o esperado. Tente novamente em alguns instantes.');
                setAuditing(false);
                return;
            }

            try {
                const res = await fetch(`/api/agency/clients/${clientId}/audit/status/${jobId}`);
                const data = await res.json();

                if (!res.ok) {
                    clearInterval(interval);
                    setError(data.error || 'Erro ao consultar status da auditoria.');
                    setAuditing(false);
                    return;
                }

                if (data.status === 'COMPLETED') {
                    clearInterval(interval);
                    setAudit({
                        scores: data.scores,
                        overallScore: data.overallScore,
                        report: data.report,
                        missions: data.missions,
                        createdAt: new Date().toISOString()
                    });
                    setAuditing(false);
                    refreshData();
                } else if (data.status === 'FAILED') {
                    clearInterval(interval);
                    setError(data.error || 'Falha ao processar a auditoria no background.');
                    setAuditing(false);
                } else if (data.status === 'NOT_FOUND') {
                    clearInterval(interval);
                    setError('Job de auditoria perdido ou não encontrado.');
                    setAuditing(false);
                }
                // Se for PROCESSING, aguarda o próximo tick (3 segundos)
            } catch (err) {
                console.error("Erro ao checar status do Raio-X", err);
            }
        }, 3000);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-emerald-500 mx-auto" size={40} />
                    <p className="text-gray-400 text-sm">Carregando Auditoria do Cliente...</p>
                </div>
            </div>
        );
    }

    if (error && !auditing) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white">
                <div className="bg-[#111827] border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Erro na Auditoria</h2>
                    <p className="text-gray-400 text-sm">{error}</p>
                    <button
                        onClick={refreshData}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold transition-all"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    // ─── Estado: Rodando a auditoria ──────────────────────────────────────────
    if (auditing) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-10 max-w-lg w-full text-center space-y-8 shadow-2xl relative">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto relative">
                            <Loader2 className="animate-spin text-emerald-500" size={36} />
                            <Sparkles className="text-emerald-400 absolute -top-1 -right-1 animate-pulse" size={16} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Raio-X de Inteligência</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Mesa de Análise do Conselho Ativa</p>
                    </div>

                    <div className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-6 min-h-[120px] flex items-center justify-center text-center">
                        <p className="text-sm font-medium text-gray-300 leading-relaxed animate-pulse">
                            {AUDIT_STEPS[auditStep]}
                        </p>
                    </div>

                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${((auditStep + 1) / AUDIT_STEPS.length) * 100}%` }}
                        />
                    </div>

                    <p className="text-[10px] text-gray-600">
                        Isso pode levar até 30 segundos. Analisando copy, marca, tráfego, dados e oferta.
                    </p>
                </div>
            </div>
        );
    }

    // ─── Estado: Sem nenhuma auditoria feita ainda ─────────────────────────────
    if (!audit) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="bg-[#0f172a]/80 border border-white/10 rounded-[40px] p-12 max-w-xl w-full text-center space-y-8 shadow-2xl backdrop-blur-md">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
                            🎯
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-none">Auditar Cliente (Raio-X)</h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                            Dispare o scanner do conselho de IAs. O site de **{client?.name}** será analisado para gerar um diagnóstico completo e a trilha de missões de crescimento.
                        </p>
                        {client?.bots?.[0] && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-xl text-xs mt-4 max-w-md mx-auto text-left">
                                <div className="flex items-center gap-2 font-bold mb-1">
                                    <Sparkles size={14} />
                                    Alvo da Auditoria:
                                </div>
                                <p className="text-gray-300">Bot: <span className="text-white font-medium">{client.bots[0].name}</span></p>
                                {(client.bots[0].websiteUrl || client.bots[0].sessionName) && (
                                    <p className="text-gray-300 truncate">Site/Origem: <span className="text-white font-medium">{client.bots[0].websiteUrl || client.bots[0].sessionName}</span></p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-4 text-xs text-gray-500 text-left space-y-2">
                        <p className="font-bold text-gray-400 flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Como funciona o Raio-X?</p>
                        <p>1. Nosso scraper varre o site oficial buscando produtos, claims, ofertas e canais.</p>
                        <p>2. Cinco especialistas baseados em metodologias reais diagnosticam as falhas do negócio.</p>
                        <p>3. Um relatório estruturado de scores (0-100) e uma Trilha de Missões acionável são criados.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push(`/dashboard/agency/clients/${clientId}`)}
                            className="flex-1 py-4 border border-white/10 hover:bg-white/5 rounded-2xl font-bold transition-all text-sm"
                        >
                            Voltar ao Hub
                        </button>
                        <button
                            onClick={handleRunAudit}
                            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-bold transition-all text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={16} /> Disparar Raio-X
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { scores, overallScore, report, missions } = audit;

    const SQUAD_METADATA: Record<string, { label: string; color: string; bg: string }> = {
        copy: { label: "Copy Squad", color: "text-orange-400 border-orange-500/20", bg: "bg-orange-500/10" },
        brand: { label: "Brand Squad", color: "text-indigo-400 border-indigo-500/20", bg: "bg-indigo-500/10" },
        traffic: { label: "Traffic Masters", color: "text-red-400 border-red-500/20", bg: "bg-red-500/10" },
        data: { label: "Data Squad", color: "text-emerald-400 border-emerald-500/20", bg: "bg-emerald-500/10" },
        hormozi: { label: "Hormozi Squad", color: "text-yellow-400 border-yellow-500/20", bg: "bg-yellow-500/10" }
    };

    const getPriorityLabel = (p: number) => {
        if (p === 1) return { label: "🚨 Crítico / Imediato", cls: "bg-red-500/20 text-red-400 border-red-500/30" };
        if (p === 2) return { label: "⚠️ Importante", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
        if (p === 3) return { label: "⚡ Recomendado", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
        return { label: "⚙️ Otimização", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    };

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white relative print:bg-white print:text-black">
            
            {/* Elementos impressos ocultados */}
            <style jsx global>{`
                @media print {
                    /* Forçar exibição completa do conteúdo e remover limites de scroll da Shell */
                    html, body, #__next {
                        background: white !important;
                        color: black !important;
                        height: auto !important;
                        min-height: 100% !important;
                        overflow: visible !important;
                    }
                    
                    /* Sobrescrever classes de layout h-screen / overflow-hidden da Shell para impressão */
                    .h-screen,
                    div[class*="h-screen"],
                    div[class*="overflow-hidden"],
                    div[class*="min-h-0"],
                    main,
                    aside,
                    .flex-1 {
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                        display: block !important;
                    }

                    /* Ocultar elementos de navegação, cabeçalhos de tela e botões */
                    aside,
                    .sidebar,
                    div[class*="sidebar"],
                    div[class*="md:hidden"],
                    .no-print,
                    button {
                        display: none !important;
                    }

                    /* Estilização para o Relatório PDF impresso */
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print-card {
                        background: #f9fafb !important;
                        border: 1px solid #e5e7eb !important;
                        color: black !important;
                        box-shadow: none !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .print-text {
                        color: #1f2937 !important;
                    }
                    .print-title {
                        color: #111827 !important;
                    }
                    
                    /* Evitar corte de páginas bagunçado */
                    .page-break {
                        page-break-before: always !important;
                        break-before: page !important;
                    }
                }
            `}</style>

            {/* Cabeçalho da página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 no-print">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push(`/dashboard/agency/clients/${clientId}`)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
                        title="Voltar ao Hub"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Raio-X de Inteligência
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">Auditoria Ativa</span>
                        </h1>
                        <p className="text-gray-400 mt-1">Diagnóstico estratégico completo da empresa de **{client?.name}**.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleRunAudit}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all text-sm flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Refazer Scanner
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-bold transition-all text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/20"
                    >
                        <Printer size={16} />
                        Exportar Relatório (PDF)
                    </button>
                </div>
            </div>

            {/* Impressão: Banner Executivo Ultra Premium */}
            <div className="hidden print:block border-b-2 border-gray-300 pb-8 mb-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-emerald-600 rounded-sm flex items-center justify-center text-white text-[9px] font-black">C</span>
                            <span className="text-xs font-black tracking-widest text-gray-500 uppercase">ConextBot Agency Intelligence</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none print-title">RAIO-X DE AUDITORIA DE PRESENÇA DIGITAL</h2>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Diagnóstico de Maturidade Estratégica, Site e Redes Sociais</p>
                    </div>
                    <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 text-right space-y-1.5 shrink-0">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Métrica de Qualidade</p>
                        <div className="flex items-center gap-2 justify-end text-emerald-600">
                            <ShieldCheck size={18} />
                            <span className="text-lg font-black">{overallScore}/100 PONTOS</span>
                        </div>
                    </div>
                </div>

                {/* Selo de Garantia de IA */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm">
                        <Award size={20} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-extrabold text-sm text-emerald-950">Homologado pelo Conselho Diretor de IA</h3>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                            Este documento certifica que o website e a presença nas mídias digitais de <strong>{client?.name}</strong> foram completamente auditados, cruzando metadados operacionais e parâmetros de conversão sob a metodologia conjunta de Gary Halbert, Marty Neumeier, Pedro Sobral, Sean Ellis e Alex Hormozi.
                        </p>
                    </div>
                </div>

                {/* Grid de Metadados do Cliente */}
                <div className="grid grid-cols-4 gap-4 pt-2">
                    <div className="bg-gray-55 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-gray-400 font-black uppercase">Cliente Auditado</p>
                        <p className="text-xs font-bold text-gray-800 mt-1 truncate">{client?.name}</p>
                    </div>
                    <div className="bg-gray-55 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-gray-400 font-black uppercase">Website Oficial</p>
                        <p className="text-xs font-bold text-gray-800 mt-1 truncate">{client?.bots?.[0]?.websiteUrl || 'Não Configurado'}</p>
                    </div>
                    <div className="bg-gray-55 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-gray-400 font-black uppercase">Nicho de Atuação</p>
                        <p className="text-xs font-bold text-gray-800 mt-1 truncate capitalize">{client?.bots?.[0]?.niche || 'Geral'}</p>
                    </div>
                    <div className="bg-gray-55 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[9px] text-gray-400 font-black uppercase">Data do Relatório</p>
                        <p className="text-xs font-bold text-gray-800 mt-1">{new Date(audit.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Bloco de Score Geral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Gauge Circular do Score */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 flex flex-col items-center justify-center text-center print-card">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6">Score Geral de Saúde</h2>
                    
                    <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                        {/* SVG Gauge */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                className="stroke-white/5 fill-none"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                className="stroke-emerald-500 fill-none transition-all duration-1000"
                                strokeWidth="8"
                                strokeDasharray={263.8}
                                strokeDashoffset={263.8 - (263.8 * overallScore) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute text-center">
                            <span className="text-5xl font-black leading-none">{overallScore}</span>
                            <span className="text-gray-500 block text-xs font-bold uppercase mt-1">Pontos</span>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-400 max-w-xs print-card print-text">
                        📢 {overallScore >= 80 ? "Excelente! O negócio apresenta alta maturidade digital. Foque em melhorias refinadas." :
                            overallScore >= 50 ? "Maturidade Média. Gargalos importantes em tráfego ou copy limitam as conversões." :
                            "Atenção Urgente! Gargalos graves identificados. Siga a Trilha de Missões imediatamente."}
                    </div>
                </div>

                {/* Pontuações por Squad */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6 print-card">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 print-title">Análise de Performance nos 5 Pilares</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {Object.entries(scores).map(([key, val]: any) => {
                            const meta = SQUAD_METADATA[key] || { label: key, color: "text-white", bg: "bg-white/10" };
                            return (
                                <div key={key} className="bg-[#0b0f1a]/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between print-card">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{meta.label}</p>
                                        <p className="text-3xl font-black mt-2 print-title">{val}</p>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1 mt-4 overflow-hidden">
                                        <div 
                                            className="bg-emerald-500 h-1 rounded-full"
                                            style={{ width: `${val}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-400 print-card">
                        <Award size={18} className="shrink-0" />
                        <span>Este diagnóstico foi elaborado programaticamente a partir da varredura profunda dos canais oficiais e metadados de onboarding do cliente.</span>
                    </div>
                </div>
            </div>

            {/* Breakdown dos Relatórios dos Especialistas */}
            <div className="space-y-6 pt-6">
                <h2 className="text-2xl font-black flex items-center gap-3 no-print">
                    <Zap className="text-emerald-500" />
                    Diagnóstico dos Especialistas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(report).map(([key, item]: any) => {
                        const meta = SQUAD_METADATA[key] || { label: key, color: "text-white", bg: "bg-white/10" };
                        return (
                            <div key={key} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 print-card">
                                <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                                    <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center font-bold text-xs ${meta.color}`}>
                                        {key.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white print-title">{meta.label}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Maturidade: {scores[key]}%</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400">Falhas Encontradas</h4>
                                    <ul className="space-y-1.5 text-xs text-gray-400 leading-relaxed list-disc list-inside print-text">
                                        {item.problems?.map((p: string, i: number) => (
                                            <li key={i}>{p}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Plano de Ação</h4>
                                    <ul className="space-y-1.5 text-xs text-gray-300 leading-relaxed list-disc list-inside print-text">
                                        {item.solutions?.map((s: string, i: number) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Trilha de Missões Gamificada */}
            <div className="space-y-6 pt-6 page-break">
                <h2 className="text-2xl font-black flex items-center gap-3 no-print">
                    <TrendingUp className="text-emerald-500" />
                    Trilha de Missões de Crescimento
                </h2>

                <div className="bg-[#0f172a]/50 border border-white/10 rounded-[40px] p-8 space-y-8 relative overflow-hidden print-card">
                    {/* Linha conectiva da trilha no desktop (oculta em print e mobile) */}
                    <div className="hidden lg:block absolute left-[51px] top-20 bottom-20 w-0.5 border-l-2 border-dashed border-white/10 pointer-events-none no-print" />

                    {missions.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">Nenhuma missão gerada. Realize uma nova auditoria.</p>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            {missions.sort((a: any, b: any) => a.priority - b.priority).map((mission: any, idx: number) => {
                                const prio = getPriorityLabel(mission.priority);
                                const squadMeta = SQUAD_METADATA[mission.squad] || { label: mission.squad, color: "text-white", bg: "bg-white/10" };

                                return (
                                    <div 
                                        key={mission.id} 
                                        className="bg-[#0b0f1a] border border-white/5 hover:border-emerald-500/20 rounded-3xl p-6 flex flex-col lg:flex-row items-start lg:items-center gap-6 group hover:bg-[#0b0f1a]/80 transition-all duration-300 print-card"
                                    >
                                        {/* Número da missão */}
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-emerald-400 shrink-0 group-hover:border-emerald-500/30 transition-colors shadow-inner no-print">
                                            #{idx + 1}
                                        </div>

                                        {/* Conteúdo */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${prio.cls}`}>
                                                    {prio.label}
                                                </span>
                                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${squadMeta.color}`}>
                                                    {squadMeta.label}
                                                </span>
                                            </div>
                                            <h3 className="font-extrabold text-lg text-white print-title group-hover:text-emerald-400 transition-colors">{mission.title}</h3>
                                            <p className="text-xs text-gray-400 leading-relaxed print-text">{mission.description}</p>
                                        </div>

                                        {/* Botão de Ação rápida */}
                                        <button
                                            onClick={() => router.push(`/dashboard/agency/squads`)}
                                            className="px-4 py-2 bg-white/5 hover:bg-emerald-500 border border-white/10 hover:border-emerald-500 text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 shrink-0 w-full lg:w-auto justify-center no-print"
                                        >
                                            Consultar Especialista
                                            <ChevronRight size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
