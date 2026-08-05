"use client";

import React, { useState, useEffect } from 'react';
import { Target, Facebook, Search, Zap, BarChart3, Plus, Settings, Sparkles, Instagram, Trash2, Edit2, Play, Pause, X } from "lucide-react";

export function AdsTab({ selectedClientId, setShowCampaignModal, bots, loadingBots, agencyClients }: any) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ campaigns: [], insights: null });
    const [loadingSave, setLoadingSave] = useState(false);
    const [automation, setAutomation] = useState({
        adsAutoOptimize: false,
        adsDailyBudget: 0,
        adsObjective: "ENGAGEMENT",
        botId: ""
    });

    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [editingAd, setEditingAd] = useState<any>(null);

    // Client Context
    const activeClient = agencyClients?.find((c: any) => c.id === selectedClientId);

    const handleSaveAutomation = async () => {
        if (!automation.botId) return alert("Selecione um bot para gerenciar a automação");
        setLoadingSave(true);
        try {
            const res = await fetch(`/api/bots/${automation.botId}/marketing-automation`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(automation)
            });
            if (res.ok) alert("Automação de anúncios atualizada com sucesso!");
            else alert("Erro ao salvar automação.");
        } catch (e) {
            alert("Erro de conexão.");
        } finally {
            setLoadingSave(false);
        }
    };

    const fetchAds = async () => {
        try {
            const url = `/api/marketing/ads${selectedClientId ? `?clientId=${selectedClientId}` : ""}`;
            const res = await fetch(url);
            const d = await res.json();
            if (res.ok) setData(d);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, [selectedClientId]);

    const handleUpdateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingSave(true);
        try {
            const res = await fetch(`/api/marketing/ads/campaigns/${editingCampaign.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingCampaign.name,
                    status: editingCampaign.status,
                    dailyBudget: editingCampaign.daily_budget,
                    clientId: selectedClientId
                })
            });
            if (res.ok) {
                alert("Campanha atualizada!");
                setEditingCampaign(null);
                fetchAds();
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao atualizar");
            }
        } catch (e) {
            alert("Erro de conexão");
        } finally {
            setLoadingSave(false);
        }
    };

    const handleUpdateAd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingSave(true);
        try {
            const res = await fetch(`/api/marketing/ads/${editingAd.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingAd.name,
                    status: editingAd.status,
                    clientId: selectedClientId
                })
            });
            if (res.ok) {
                alert("Anúncio atualizado!");
                setEditingAd(null);
                fetchAds();
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao atualizar");
            }
        } catch (e) {
            alert("Erro de conexão");
        } finally {
            setLoadingSave(false);
        }
    };

    const handleDeleteAd = async (adId: string) => {
        if (!confirm("Tem certeza que deseja deletar permanentemente este anúncio da Meta? Esta ação não pode ser desfeita e os dados podem ser perdidos.")) return;
        try {
            const res = await fetch(`/api/marketing/ads/${adId}?clientId=${selectedClientId || ""}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert("Anúncio deletado.");
                fetchAds();
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao deletar");
            }
        } catch (e) {
            alert("Erro de conexão");
        }
    };

    const [platformFilter, setPlatformFilter] = useState("ALL"); // ALL, META, GOOGLE

    const metaCampaigns = data.campaigns || [];
    const metaSpend = data.insights?.spend ? parseFloat(data.insights.spend) : 0;
    const metaCtr = data.insights?.inline_link_click_ctr ? parseFloat(data.insights.inline_link_click_ctr) : 0;

    const googleCampaigns = data.googleAds || [];
    const googleSpend = googleCampaigns.reduce((acc: number, cur: any) => acc + (cur.metrics?.cost_micros ? cur.metrics.cost_micros / 1000000 : 0), 0);
    const googleImpressions = googleCampaigns.reduce((acc: number, cur: any) => acc + Number(cur.metrics?.impressions || 0), 0);
    const googleClicks = googleCampaigns.reduce((acc: number, cur: any) => acc + Number(cur.metrics?.clicks || 0), 0);
    const googleCtr = googleImpressions > 0 ? (googleClicks / googleImpressions) * 100 : 0;

    // Normalize lists
    const normMeta = metaCampaigns.map((c: any) => ({...c, _platform: "META"}));
    const normGoogle = googleCampaigns.map((c: any) => ({
         id: c.campaign?.id,
         name: c.campaign?.name,
         status: c.campaign?.status === "ENABLED" ? "ACTIVE" : c.campaign?.status,
         objective: "SEARCH",
         daily_budget: null,
         _platform: "GOOGLE",
         metrics: c.metrics
    }));

    let displaySpend = 0;
    let displayCtr = 0;
    let displayCampaigns: any[] = [];

    if (platformFilter === "ALL") {
        displaySpend = metaSpend + googleSpend;
        displayCtr = (metaCtr + googleCtr) / ((googleCtr > 0 && metaCtr > 0) ? 2 : 1);
        displayCampaigns = [...normMeta, ...normGoogle];
    } else if (platformFilter === "META") {
        displaySpend = metaSpend;
        displayCtr = metaCtr;
        displayCampaigns = normMeta;
    } else if (platformFilter === "GOOGLE") {
        displaySpend = googleSpend;
        displayCtr = googleCtr;
        displayCampaigns = normGoogle;
    }

    return (
        <div className="space-y-6 relative">
            
            {/* Banner de Contexto do Cliente */}
            {activeClient ? (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4 text-blue-400">
                    <Target size={20} className="animate-pulse" />
                    <div>
                        <p className="text-xs uppercase tracking-wider font-bold opacity-80">Gerenciando contas e anúncios de</p>
                        <p className="text-lg font-bold text-white">{activeClient.name}</p>
                    </div>
                </div>
            ) : selectedClientId ? (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4 text-blue-400">
                    <Target size={20} className="animate-pulse" />
                    <div>
                        <p className="text-xs uppercase tracking-wider font-bold opacity-80">Gerenciando contas e anúncios de</p>
                        <p className="text-lg font-bold text-white">Cliente Selecionado (ID: {selectedClientId})</p>
                    </div>
                </div>
            ) : (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-4 text-purple-400">
                    <Zap size={20} />
                    <div>
                        <p className="text-xs uppercase tracking-wider font-bold opacity-80">Workspace</p>
                        <p className="text-lg font-bold text-white">Minha Agência (Próprio)</p>
                    </div>
                </div>
            )}

            {/* Filtros de Plataforma */}
            <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                <button 
                    onClick={() => setPlatformFilter("ALL")}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${platformFilter === "ALL" ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Target size={16} /> Tudo Junto
                </button>
                <button 
                    onClick={() => setPlatformFilter("META")}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${platformFilter === "META" ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Facebook size={16} /> Meta Ads
                </button>
                <button 
                    onClick={() => setPlatformFilter("GOOGLE")}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${platformFilter === "GOOGLE" ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Search size={16} /> Google Ads
                </button>
            </div>

            {/* Saldo da Conta Meta Ads */}
            {platformFilter !== "GOOGLE" && data.metaBalance && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Saldo Disponível</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            {data.metaBalance.currency} {data.metaBalance.balance.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Já Gasto</p>
                        <p className="text-2xl font-bold text-white">
                            {data.metaBalance.currency} {data.metaBalance.amount_spent.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Limite de Gasto</p>
                        <p className="text-2xl font-bold text-white">
                            {data.metaBalance.spend_cap > 0 ? `${data.metaBalance.currency} ${data.metaBalance.spend_cap.toFixed(2)}` : "Sem limite"}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold">Gerenciador de Anúncios (Meta & Google)</h3>
                    <button 
                        onClick={() => setShowCampaignModal(true)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nova Campanha
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Sparkles className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : displayCampaigns.length === 0 ? (
                        <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10">
                            <p className="text-gray-500">Nenhuma campanha encontrada para a plataforma selecionada.</p>
                            <p className="text-xs text-gray-600 mt-1">Configure seu Token e ID da Conta na aba de Integrações.</p>
                        </div>
                    ) : (
                        displayCampaigns.map((camp: any) => (
                            <div key={camp.id} className={`bg-[#0b0f1a] border border-white/5 rounded-2xl p-4 flex flex-col gap-4 transition-all ${camp._platform === 'GOOGLE' ? 'hover:border-red-500/30' : 'hover:border-blue-500/30'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                        {camp._platform === 'GOOGLE' ? <Search size={24} className="text-red-400" /> : <Instagram size={24} className="text-blue-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold truncate text-lg">{camp.name}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${camp.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gray-400/10 text-gray-400'}`}>
                                                {camp.status}
                                            </span>
                                            <span className="text-xs text-gray-500">Objetivo: {camp.objective}</span>
                                            {camp.daily_budget !== null && <span className="text-xs text-gray-500">Orçamento: R$ {(camp.daily_budget / 100).toFixed(2)}/dia</span>}
                                            {camp._platform === 'GOOGLE' && <span className="text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-2 rounded-lg">Google Ads</span>}
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        {camp._platform === 'META' && (
                                            <button onClick={() => setEditingCampaign({...camp})} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg flex gap-2 items-center text-sm border border-white/10">
                                                <Settings size={16} /> Configurações
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* AdSets & Ads List */}
                                {camp.adsets?.data && camp.adsets.data.length > 0 && (
                                    <div className="pl-16 space-y-3 pt-2 border-t border-white/5 mt-2">
                                        {camp.adsets.data.map((adset: any) => (
                                            <div key={adset.id} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Target size={14} className="text-blue-400"/>
                                                        <span className="font-bold text-gray-300">{adset.name}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${adset.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>{adset.status}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Ads */}
                                                {adset.ads?.data && adset.ads.data.length > 0 && (
                                                    <div className="pl-6 space-y-2">
                                                        {adset.ads.data.map((ad: any) => (
                                                            <div key={ad.id} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5 group hover:bg-white/5 transition-all">
                                                                <div className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                                    {ad.creative?.thumbnail_url || ad.creative?.image_url ? (
                                                                        <img src={ad.creative.thumbnail_url || ad.creative.image_url} alt="Ad Thumbnail" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center"><Sparkles size={12} className="text-gray-500"/></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-gray-300 line-clamp-1">{ad.name}</p>
                                                                    <p className={`text-[10px] ${ad.status === 'ACTIVE' ? 'text-emerald-400' : 'text-gray-500'}`}>{ad.status}</p>
                                                                </div>
                                                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 pr-2 transition-all">
                                                                    <button 
                                                                        onClick={() => setEditingAd({...ad})}
                                                                        className="p-1.5 text-gray-400 hover:text-blue-400 bg-black/40 rounded-lg" title="Editar Anúncio">
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteAd(ad.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-400 bg-black/40 rounded-lg" title="Deletar Anúncio">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Campaign Edit Modal */}
            {editingCampaign && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0b0f1a] border border-[#1e2532] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Editar Campanha</h3>
                            <button onClick={() => setEditingCampaign(null)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCampaign} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Nome da Campanha</label>
                                <input 
                                    type="text" 
                                    value={editingCampaign.name} 
                                    onChange={e => setEditingCampaign({...editingCampaign, name: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Status</label>
                                <select 
                                    value={editingCampaign.status} 
                                    onChange={e => setEditingCampaign({...editingCampaign, status: e.target.value})}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                                >
                                    <option value="ACTIVE">Ativa (Rodando)</option>
                                    <option value="PAUSED">Pausada</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Orçamento Diário (R$)</label>
                                <input 
                                    type="number" 
                                    value={editingCampaign.daily_budget ? (editingCampaign.daily_budget / 100) : 0} 
                                    onChange={e => setEditingCampaign({...editingCampaign, daily_budget: parseFloat(e.target.value) * 100})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loadingSave}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center mt-6"
                            >
                                {loadingSave ? "Salvando..." : "Salvar Alterações"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Ad Edit Modal */}
            {editingAd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0b0f1a] border border-[#1e2532] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Editar Anúncio</h3>
                            <button onClick={() => setEditingAd(null)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateAd} className="p-6 space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-300 text-xs mb-4">
                                Nota: A Meta não permite edição de imagens ou vídeos em anúncios ativos. Se precisar alterar o visual, delete este anúncio e crie um novo.
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Nome do Anúncio</label>
                                <input 
                                    type="text" 
                                    value={editingAd.name} 
                                    onChange={e => setEditingAd({...editingAd, name: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Status</label>
                                <select 
                                    value={editingAd.status} 
                                    onChange={e => setEditingAd({...editingAd, status: e.target.value})}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                                >
                                    <option value="ACTIVE">Ativo (Rodando)</option>
                                    <option value="PAUSED">Pausado</option>
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loadingSave}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center mt-6"
                            >
                                {loadingSave ? "Salvando..." : "Salvar Anúncio"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
