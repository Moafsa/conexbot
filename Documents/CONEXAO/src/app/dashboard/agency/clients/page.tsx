"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, Mail, Building2, Trash2, ExternalLink, UserPlus, LayoutDashboard, FileText, Copy, Check, Edit2, Send, MessageSquare, Bot, Sparkles } from "lucide-react";

export default function AgencyClientsPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [inviteCpfCnpj, setInviteCpfCnpj] = useState("");
    const [invitePhone, setInvitePhone] = useState("");
    const [inviteNiche, setInviteNiche] = useState("generico");
    const [inviteWebsite, setInviteWebsite] = useState("");
    const [inviteSitePreview, setInviteSitePreview] = useState<any>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Transfer request state
    const [transferError, setTransferError] = useState<{ isDuplicate: boolean, email: string, requesting: boolean, success: boolean }>({
        isDuplicate: false, email: "", requesting: false, success: false
    });

    const NICHES = [
        { value: 'generico', label: '🤖 Genérico' },
        { value: 'restaurante', label: '🍽️ Restaurante / Delivery' },
        { value: 'clinica', label: '🏥 Clínica / Saúde' },
        { value: 'ecommerce', label: '🛒 E-commerce / Loja' },
        { value: 'salao', label: '💈 Salão / Estética' },
        { value: 'imobiliaria', label: '🏠 Imobiliária' },
        { value: 'distribuidora', label: '🛢️ Distribuidora / Gás' },
    ];

    // Invoice Modal states
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [selectedInterval, setSelectedInterval] = useState("MONTHLY");
    const [selectedGateway, setSelectedGateway] = useState("asaas");
    const [generatingInvoice, setGeneratingInvoice] = useState(false);
    const [generatedInvoiceUrl, setGeneratedInvoiceUrl] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    // Edit Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editClient, setEditClient] = useState<any>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editCpfCnpj, setEditCpfCnpj] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [sendingAccessId, setSendingAccessId] = useState<string | null>(null);

    useEffect(() => { 
        fetchClients(); 
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/plans");
            const data = await res.json();
            if (data && Array.isArray(data.plans)) {
                setAvailablePlans(data.plans);
                if (data.plans.length > 0) setSelectedPlanId(data.plans[0].id);
            }
        } catch (e) { console.error("Error fetching plans", e); }
    };

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/agency/clients");
            const data = await res.json();
            if (Array.isArray(data)) setClients(data);
            else setError(data.error || "Erro ao carregar clientes");
        } catch {
            setError("Erro de conexão");
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewSite = async () => {
        if (!inviteWebsite) return;
        setPreviewLoading(true);
        setInviteSitePreview(null);
        try {
            const res = await fetch("/api/agency/onboarding/preview-site", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: inviteWebsite })
            });
            const data = await res.json();
            if (res.ok && data.extracted) {
                setInviteSitePreview(data.extracted);
                if (data.extracted.niche) setInviteNiche(data.extracted.niche.toLowerCase());
                if (data.extracted.businessName && !inviteName) setInviteName(data.extracted.businessName);
            }
        } catch { /* silent */ } finally {
            setPreviewLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !inviteName) return alert("Preencha nome e e-mail.");
        if (!inviteCpfCnpj) return alert("CPF/CNPJ é obrigatório para emissão de faturas.");
        if (!invitePhone) return alert("Telefone é obrigatório para emissão de faturas.");
        setInviting(true);
        try {
            // Use the full onboarding endpoint (creates Tenant + Bot + Pipeline + Stages + Rules + UsageCounter)
            const res = await fetch("/api/agency/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: inviteEmail,
                    name: inviteName,
                    cpfCnpj: inviteCpfCnpj,
                    phone: invitePhone,
                    niche: inviteNiche,
                    websiteUrl: inviteWebsite || undefined,
                    knowledgeBase: inviteSitePreview?.knowledgeBaseExcerpt || undefined,
                })
            });
            const data = await res.json();
            if (res.ok) {
                const tmpl = data.template?.label || inviteNiche;
                alert(`✅ Cliente cadastrado com sucesso!\n\nE-mail: ${inviteEmail}\nSenha provisória: ${data.tempPassword}\nBot criado: ${tmpl}\n\nCompartilhe estas credenciais com o cliente.`);
                setShowInviteModal(false);
                setInviteEmail(""); setInviteName(""); setInviteCpfCnpj("");
                setInvitePhone(""); setInviteNiche("generico"); setInviteWebsite("");
                setInviteSitePreview(null);
                fetchClients();
            } else {
                if (data.error === 'CLIENT_ALREADY_EXISTS') {
                    setTransferError({ isDuplicate: true, email: data.existingEmail, requesting: false, success: false });
                    alert(data.message || "Este cliente já pertence a outra agência.");
                } else {
                    alert(data.error || "Erro ao adicionar cliente.");
                }
            }
        } catch {
            alert("Erro de conexão.");
        } finally {
            setInviting(false);
        }
    };

    const handleRequestTransfer = async () => {
        setTransferError(s => ({ ...s, requesting: true }));
        try {
            const res = await fetch("/api/agency/transfer-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: transferError.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao solicitar transferência.");
            setTransferError(s => ({ ...s, success: true, requesting: false }));
        } catch (err: any) {
            alert(err.message);
            setTransferError(s => ({ ...s, requesting: false }));
        }
    };

    const handleGenerateInvoice = async () => {
        if (!selectedPlanId) return alert("Selecione um plano.");
        setGeneratingInvoice(true);
        setGeneratedInvoiceUrl(null);
        setCopiedLink(false);

        try {
            const res = await fetch(`/api/agency/clients/${selectedClientForInvoice.id}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: selectedPlanId,
                    interval: selectedInterval,
                    gateway: selectedGateway
                })
            });
            const data = await res.json();
            if (res.ok && data.checkoutUrl) {
                setGeneratedInvoiceUrl(data.checkoutUrl);
                fetchClients(); // refresh to show pending subscription if any
            } else {
                alert(data.error || "Erro ao gerar fatura.");
            }
        } catch (e) {
            alert("Erro de conexão.");
        } finally {
            setGeneratingInvoice(false);
        }
    };

    const openEditModal = (client: any) => {
        setEditClient(client);
        setEditName(client.name || "");
        setEditEmail(client.email || "");
        setEditCpfCnpj(client.cpfCnpj || "");
        setEditPhone(client.whatsapp || "");
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        if (!editName || !editEmail) return alert("Preencha nome e e-mail.");
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/agency/clients/${editClient.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    email: editEmail,
                    cpfCnpj: editCpfCnpj,
                    phone: editPhone
                })
            });
            if (res.ok) {
                setShowEditModal(false);
                fetchClients();
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao editar cliente.");
            }
        } catch {
            alert("Erro de conexão.");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleSendAccess = async (clientId: string, onlyCopy = false) => {
        setSendingAccessId(clientId);
        try {
            const res = await fetch(`/api/agency/clients/${clientId}/send-access`, {
                method: "POST"
            });
            const data = await res.json();
            if (res.ok) {
                if (onlyCopy) {
                    const text = `Link: ${data.appUrl}/auth/login\nE-mail: ${data.email}\nSenha: ${data.tempPassword}`;
                    await navigator.clipboard.writeText(text);
                    alert("✅ Credenciais copiadas para a área de transferência!");
                } else if (data.whatsappSent) {
                    alert("✅ Credenciais de acesso enviadas via WhatsApp com sucesso!");
                } else {
                    alert(data.error || "⚠️ Credenciais geradas, mas o WhatsApp não pôde ser enviado. Use a opção de copiar.");
                }
            } else {
                alert(data.error || "Erro ao processar solicitação.");
            }
        } catch (err: any) {
            console.error("Fetch error:", err);
            alert("Erro ao processar solicitação. Verifique os logs do servidor.");
        } finally {
            setSendingAccessId(null);
        }
    };

    const handleRemoveClient = async (clientId: string) => {
        if (!confirm("Atenção: Ao remover este cliente da sua agência, o cadastro e os dados dele CONTINUARÃO no sistema (nada será apagado), mas ele será desvinculado da sua gestão. Deseja continuar?")) return;
        
        try {
            const res = await fetch(`/api/agency/clients/${clientId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchClients();
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao remover cliente.");
            }
        } catch {
            alert("Erro de conexão.");
        }
    };

    const filtered = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="text-emerald-500" />
                        Meus Clientes
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie os clientes sob sua gestão.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-2xl font-medium text-sm transition-all text-gray-300"
                        title="Cadastro rápido"
                    >
                        <UserPlus size={16} />
                        <span className="hidden sm:inline">Rápido</span>
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/agency/clients/new")}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20"
                    >
                        <Sparkles size={18} />
                        Novo Cliente (Wizard)
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-gray-500 text-sm">Total de Clientes</p>
                    <p className="text-3xl font-black mt-1">{clients.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-gray-500 text-sm">Com Assinatura Ativa</p>
                    <p className="text-3xl font-black mt-1 text-emerald-400">
                        {clients.filter(c => c.subscriptions?.some((s: any) => s.status === 'ACTIVE')).length}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-gray-500 text-sm">Sem Assinatura</p>
                    <p className="text-3xl font-black mt-1 text-orange-400">
                        {clients.filter(c => !c.subscriptions?.some((s: any) => ['ACTIVE', 'TRIALING'].includes(s.status))).length}
                    </p>
                </div>
            </div>

            {/* Search + Table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Carregando...</div>
                ) : error ? (
                    <div className="p-12 text-center text-red-400">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                            <Users size={24} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Nenhum cliente cadastrado ainda.</p>
                        <p className="text-gray-600 text-xs">Clique em "Adicionar Cliente" para começar.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest font-bold">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Assinaturas</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((client: any) => {
                                const activeSub = client.subscriptions?.find((s: any) => ['ACTIVE', 'TRIALING'].includes(s.status));
                                return (
                                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                                                    {client.name?.charAt(0) || "C"}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{client.name || "—"}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Building2 size={10} /> Cliente
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} />
                                                {client.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold">
                                                {client.subscriptions?.length || 0} serviço(s)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-black px-3 py-1 rounded-full ${activeSub ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                {activeSub ? 'ATIVO' : 'SEM PLANO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(client)}
                                                    title="Editar Cliente"
                                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                
                                                <button
                                                    onClick={() => { setSelectedClientForInvoice(client); setShowInvoiceModal(true); setGeneratedInvoiceUrl(null); }}
                                                    title="Gerar Fatura"
                                                    className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all"
                                                >
                                                    <FileText size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleSendAccess(client.id, true)}
                                                    disabled={sendingAccessId === client.id}
                                                    title="Copiar Credenciais (Link, Email, Senha)"
                                                    className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50"
                                                >
                                                    {sendingAccessId === client.id ? (
                                                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Copy size={16} />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleSendAccess(client.id)}
                                                    disabled={sendingAccessId === client.id}
                                                    title="Enviar Acesso via WhatsApp"
                                                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50"
                                                >
                                                    {sendingAccessId === client.id ? (
                                                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <MessageSquare size={16} />
                                                    )}
                                                </button>

                                                <Link
                                                    href={`/dashboard/agency/clients/${client.id}`}
                                                    title="Central de Serviços"
                                                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all"
                                                >
                                                    <LayoutDashboard size={16} />
                                                </Link>

                                                <button
                                                    onClick={() => handleRemoveClient(client.id)}
                                                    title="Remover Cliente"
                                                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Plus className="text-emerald-500" />
                                Adicionar Novo Cliente
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">O cliente será vinculado à sua agência.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Website URL + Auto-detect */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Site do Cliente (Opcional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        placeholder="https://empresa.com.br"
                                        className="flex-1 bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                        value={inviteWebsite}
                                        onChange={(e) => setInviteWebsite(e.target.value)}
                                    />
                                    <button
                                        onClick={handlePreviewSite}
                                        disabled={!inviteWebsite || previewLoading}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl text-xs font-bold transition-all whitespace-nowrap"
                                    >
                                        {previewLoading ? '⏳...' : '🔍 Detectar'}
                                    </button>
                                </div>
                                {inviteSitePreview && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                                        <p className="font-bold text-emerald-400">✅ Site detectado: {inviteSitePreview.businessName}</p>
                                        {inviteSitePreview.address && <p>📍 {inviteSitePreview.address}</p>}
                                        {inviteSitePreview.hours && <p>🕐 {inviteSitePreview.hours}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Nome do Cliente / Empresa</label>
                                <input
                                    type="text"
                                    placeholder="Ex: João da Silva / Empresa XYZ"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                />
                            </div>

                            {/* Niche selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Nicho / Segmento</label>
                                <select
                                    value={inviteNiche}
                                    onChange={(e) => setInviteNiche(e.target.value)}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                >
                                    {NICHES.map(n => (
                                        <option key={n.value} value={n.value}>{n.label}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-600">O bot será criado com template e funil de vendas pré-configurado para este nicho.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">E-mail de Acesso</label>
                                <input
                                    type="email"
                                    placeholder="cliente@empresa.com"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">CPF / CNPJ <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="000.000.000-00"
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                        value={inviteCpfCnpj}
                                        onChange={(e) => setInviteCpfCnpj(e.target.value)}
                                        maxLength={18}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Telefone / WhatsApp <span className="text-red-400">*</span></label>
                                    <input
                                        type="tel"
                                        placeholder="(11) 99999-9999"
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                        value={invitePhone}
                                        onChange={(e) => setInvitePhone(e.target.value)}
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-gray-400">
                            💡 Bot, funil de vendas, regras de follow-up e senha de acesso são criados automaticamente.
                        </div>
                        
                        {transferError.isDuplicate && !transferError.success && (
                            <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4 space-y-3">
                                <p className="text-sm text-red-400 font-bold">⚠️ Este cliente já pertence a outra agência.</p>
                                <button
                                    onClick={handleRequestTransfer}
                                    disabled={transferError.requesting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm transition-colors border border-red-500/30 font-bold disabled:opacity-50"
                                >
                                    {transferError.requesting ? "⏳ Solicitando..." : "Solicitar Transferência de Agência"}
                                </button>
                            </div>
                        )}
                        {transferError.success && (
                            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-4 text-sm text-emerald-400 font-bold">
                                ✅ Solicitação enviada! Um e-mail foi enviado ao cliente para aprovação.
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={inviting}
                                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                {inviting ? "Adicionando..." : "Adicionar Cliente"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && selectedClientForInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <FileText className="text-blue-500" />
                                Gerar Link de Pagamento
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Gere uma fatura no valor definido da sua agência para {selectedClientForInvoice.name}.</p>
                        </div>

                        {!generatedInvoiceUrl ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Selecione o Plano</label>
                                    <select
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                                        value={selectedPlanId}
                                        onChange={(e) => setSelectedPlanId(e.target.value)}
                                    >
                                        <option value="" disabled>Escolha um plano...</option>
                                        {availablePlans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - Preço Base: R$ {p.price}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Periodicidade</label>
                                    <select
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                                        value={selectedInterval}
                                        onChange={(e) => setSelectedInterval(e.target.value)}
                                    >
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="QUARTERLY">Trimestral</option>
                                        <option value="SEMIANNUAL">Semestral</option>
                                        <option value="YEARLY">Anual</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Gateway</label>
                                    <select
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                                        value={selectedGateway}
                                        onChange={(e) => setSelectedGateway(e.target.value)}
                                    >
                                        <option value="asaas">Asaas (Boleto/Pix)</option>
                                        <option value="mercadopago">Mercado Pago (Cartão/Pix)</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowInvoiceModal(false)}
                                        className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-bold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleGenerateInvoice}
                                        disabled={generatingInvoice}
                                        className="flex-1 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                                    >
                                        {generatingInvoice ? "Gerando..." : "Gerar Link"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                        <Check size={24} />
                                    </div>
                                    <p className="text-emerald-400 font-bold">Fatura Gerada com Sucesso!</p>
                                    <p className="text-xs text-gray-400">Copie o link abaixo e envie para o cliente.</p>
                                </div>

                                <div className="flex items-center gap-2 bg-[#0b0f1a] border border-white/10 rounded-2xl p-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={generatedInvoiceUrl} 
                                        className="bg-transparent border-none outline-none text-sm text-gray-300 w-full px-2"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedInvoiceUrl);
                                            setCopiedLink(true);
                                            setTimeout(() => setCopiedLink(false), 2000);
                                        }}
                                        className="shrink-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all flex items-center justify-center"
                                    >
                                        {copiedLink ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all font-bold"
                                >
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {showEditModal && editClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-8 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Edit2 className="text-emerald-500" />
                                Editar Cliente
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Atualize as informações de {editClient.name}.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Nome do Cliente / Empresa</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">E-mail de Acesso</label>
                                <input
                                    type="email"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">CPF / CNPJ</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                        value={editCpfCnpj}
                                        onChange={(e) => setEditCpfCnpj(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Telefone / WhatsApp</label>
                                    <input
                                        type="tel"
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-emerald-500/50"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Senha e Acesso</p>
                                <p className="text-[10px] text-gray-500 mt-1">Gere uma nova senha e envie os dados de acesso para o WhatsApp do cliente.</p>
                            </div>
                            <button
                                onClick={() => { handleSendAccess(editClient.id); }}
                                disabled={sendingAccessId === editClient.id}
                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                            >
                                {sendingAccessId === editClient.id ? "..." : "Resetar e Enviar"}
                            </button>
                            <button
                                onClick={() => { handleSendAccess(editClient.id, true); }}
                                disabled={sendingAccessId === editClient.id}
                                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                            >
                                {sendingAccessId === editClient.id ? "..." : "Resetar e Copiar"}
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={savingEdit}
                                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                                {savingEdit ? "Salvando..." : "Salvar Alterações"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
