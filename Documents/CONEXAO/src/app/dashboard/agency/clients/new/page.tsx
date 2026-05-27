"use client";

/**
 * /dashboard/agency/clients/new
 *
 * Multi-step onboarding wizard for new agency clients.
 * 7 steps matching the full cowork spec:
 *   1. Negócio        – website, business name, niche
 *   2. Público-alvo   – target audience, tone, persona
 *   3. Produtos       – products/services, key differentials
 *   4. Canais         – WhatsApp number, opening hours, address
 *   5. Financeiro     – payment methods, average ticket
 *   6. IA do Bot      – bot name, personality, modules
 *   7. Acesso         – client email, phone, CPF/CNPJ → review + submit
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Building2, Users, Package, Phone, DollarSign, Bot, CheckCircle2,
    ChevronRight, ChevronLeft, Globe, Sparkles, Loader2, AlertCircle,
    MapPin, Clock, Tag, Mail, User, MessageSquare, Zap, Shield, Plus, X
} from "lucide-react";

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Negócio",       icon: Building2,    desc: "Informações da empresa" },
    { id: 2, label: "Público-alvo",  icon: Users,        desc: "Quem você quer alcançar" },
    { id: 3, label: "Produtos",      icon: Package,      desc: "O que você vende" },
    { id: 4, label: "Canais",        icon: Phone,        desc: "Como o bot vai atender" },
    { id: 5, label: "Financeiro",    icon: DollarSign,   desc: "Formas de pagamento" },
    { id: 6, label: "IA do Bot",     icon: Bot,          desc: "Personalidade do agente" },
    { id: 7, label: "Acesso",        icon: CheckCircle2, desc: "Credenciais do cliente" },
];

const NICHES = [
    { value: "generico",      label: "🤖 Genérico" },
    { value: "restaurante",   label: "🍽️ Restaurante / Delivery" },
    { value: "clinica",       label: "🏥 Clínica / Saúde" },
    { value: "ecommerce",     label: "🛒 E-commerce / Loja" },
    { value: "salao",         label: "💈 Salão / Estética" },
    { value: "imobiliaria",   label: "🏠 Imobiliária" },
];

const PAYMENT_OPTIONS = [
    "PIX", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Dinheiro", "Transferência"
];

const MODULE_OPTIONS = [
    { id: "crm",       label: "CRM / Leads",      icon: Users },
    { id: "payments",  label: "Pagamentos",        icon: DollarSign },
    { id: "scheduling",label: "Agendamentos",      icon: Clock },
    { id: "catalog",   label: "Catálogo / Cardápio",icon: Package },
];

const CHANNEL_PROVIDERS = [
    { value: "whatsapp",  label: "📱 WhatsApp",       placeholder: "11999887766" },
    { value: "instagram", label: "📸 Instagram",      placeholder: "@seu_handle" },
    { value: "tiktok",    label: "🎵 TikTok",         placeholder: "@seu_handle" },
    { value: "facebook",  label: "👍 Facebook",       placeholder: "@seu_pagina" },
    { value: "phone",     label: "☎️ Telefone",       placeholder: "11999887766" },
];

// ─── Initial form state ───────────────────────────────────────────────────────
const INITIAL = {
    // Step 1 – Negócio
    websiteUrl:      "",
    businessName:    "",
    niche:           "generico",
    description:     "",
    address:         "",
    // Step 2 – Público-alvo
    targetAudience:  "",
    tone:            "Profissional",
    persona:         "",
    // Step 3 – Produtos
    productsServices:"",
    differentials:   "",
    keyProducts:     "",
    // Step 4 – Canais (multi-channel)
    channels:        [] as Array<{ provider: string; identifier: string }>,
    hours:           "",
    // Step 5 – Financeiro
    paymentMethods:  [] as string[],
    avgTicket:       "",
    // Step 6 – IA do Bot
    botName:         "",
    systemPrompt:    "",
    modules:         ["crm"] as string[],
    // Step 7 – Acesso
    clientName:      "",
    clientEmail:     "",
    clientPhone:     "",
    clientCpfCnpj:   "",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewClientWizardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editingClientId = searchParams.get('clientId');
    const isEditing = !!editingClientId;

    const [step, setStep]   = useState(1);
    const [form, setForm]   = useState(INITIAL);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // AI auto-fill state
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewDone,    setPreviewDone]    = useState(false);

    // Load existing data for editing
    const [loadingEdit, setLoadingEdit] = useState(isEditing);

    // Submit state
    const [submitting, setSubmitting] = useState(false);
    const [result,     setResult]     = useState<any>(null);
    const [submitError,setSubmitError]= useState<string | null>(null);

    // ── Load existing client data for editing ─────────────────────────────────
    useEffect(() => {
        if (isEditing && editingClientId) {
            fetch(`/api/agency/clients/${editingClientId}/onboarding`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setForm(f => ({
                            ...f,
                            // Step 1 – Negócio
                            businessName: data.businessName || f.businessName,
                            niche: data.niche || f.niche,
                            address: data.address || f.address,
                            websiteUrl: data.websiteUrl || f.websiteUrl,
                            // Step 4 – Canais
                            channels: data.channels || f.channels,
                            hours: data.hours || f.hours,
                            // Step 6 – IA do Bot
                            botName: data.botName || f.botName,
                            systemPrompt: data.systemPrompt || f.systemPrompt,
                            modules: data.modules || f.modules,
                            // Step 7 – Acesso
                            clientName: data.clientName || f.clientName,
                            clientEmail: data.clientEmail || f.clientEmail,
                            clientPhone: data.clientPhone || f.clientPhone,
                            clientCpfCnpj: data.clientCpfCnpj || f.clientCpfCnpj,
                        }));
                        setPreviewDone(true);
                    }
                    setLoadingEdit(false);
                })
                .catch(() => {
                    setLoadingEdit(false);
                });
        }
    }, [isEditing, editingClientId]);

    // ── helpers ────────────────────────────────────────────────────────────────
    const set = (key: keyof typeof INITIAL, value: any) =>
        setForm(f => ({ ...f, [key]: value }));

    const toggleArr = (key: "paymentMethods" | "modules", val: string) => {
        setForm(f => {
            const arr = f[key] as string[];
            return { ...f, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
        });
    };

    // ── Multi-channel helpers ──────────────────────────────────────────────
    const addChannel = (provider: string) => {
        setForm(f => ({
            ...f,
            channels: [...f.channels, { provider, identifier: "" }],
        }));
    };

    const removeChannel = (index: number) => {
        setForm(f => ({
            ...f,
            channels: f.channels.filter((_, i) => i !== index),
        }));
    };

    const updateChannel = (index: number, identifier: string) => {
        setForm(f => {
            const newChannels = [...f.channels];
            newChannels[index].identifier = identifier;
            return { ...f, channels: newChannels };
        });
    };

    // ── AI website auto-fill ───────────────────────────────────────────────────
    const handlePreviewSite = useCallback(async () => {
        if (!form.websiteUrl) return;
        setPreviewLoading(true);
        try {
            const res  = await fetch("/api/agency/onboarding/preview-site", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ url: form.websiteUrl }),
            });
            const data = await res.json();
            if (res.ok && data.extracted) {
                const e = data.extracted;
                setForm(f => ({
                    ...f,
                    // Step 1 - Negócio
                    businessName:     e.businessName    || f.businessName,
                    niche:            e.niche           || f.niche,
                    description:      e.description     || f.description,
                    address:          e.address         || f.address,
                    // Step 3 - Produtos
                    productsServices: (e.keyProducts || []).join(", ") || f.productsServices,
                    // Step 4 - Canais
                    hours:            e.hours           || f.hours,
                    // Step 6 - IA do Bot
                    botName:          e.suggestedBotName|| f.botName,
                    // Step 7 - Acesso (auto-fill client contact info from site)
                    clientName:       f.clientName || e.businessName || f.clientName,
                    clientPhone:      f.clientPhone || e.phone || f.clientPhone,
                    clientEmail:      f.clientEmail || e.email || f.clientEmail,
                    clientCpfCnpj:    f.clientCpfCnpj || e.cpfCnpj || f.clientCpfCnpj,
                }));
                setPreviewDone(true);
            }
        } catch { /* silent */ }
        finally { setPreviewLoading(false); }
    }, [form.websiteUrl]);

    // ── step validation ────────────────────────────────────────────────────────
    const validate = (s: number): boolean => {
        const e: Record<string, string> = {};
        if (s === 1) {
            if (!form.businessName.trim()) e.businessName = "Nome do negócio é obrigatório";
        }
        if (s === 7) {
            if (!form.clientName.trim())   e.clientName   = "Nome do responsável é obrigatório";
            if (!form.clientEmail.trim())  e.clientEmail  = "E-mail é obrigatório";
            if (!form.clientPhone.trim())  e.clientPhone  = "Telefone é obrigatório";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate(step)) setStep(s => Math.min(s + 1, 7)); };
    const back = () => setStep(s => Math.max(s - 1, 1));

    // ── submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate(7)) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                name:            form.clientName,
                email:           form.clientEmail,
                phone:           form.clientPhone,
                cpfCnpj:         form.clientCpfCnpj || undefined,
                niche:           form.niche,
                botName:         form.botName || `Bot ${form.businessName}`,
                websiteUrl:      form.websiteUrl || undefined,
                address:         form.address || undefined,
                hours:           form.hours || undefined,
                // Multi-channel support
                channels:        form.channels.length ? form.channels : undefined,
                // Extended fields passed through to bot creation
                targetAudience:  form.targetAudience || undefined,
                tone:            form.tone || undefined,
                persona:         form.persona || undefined,
                productsServices:form.productsServices || undefined,
                differentials:   form.differentials || undefined,
                paymentMethods:  form.paymentMethods.length ? form.paymentMethods.join(", ") : undefined,
                avgTicket:       form.avgTicket || undefined,
                systemPrompt:    form.systemPrompt || undefined,
                modules:         form.modules,
                description:     form.description || undefined,
            };

            const endpoint = isEditing
                ? `/api/agency/clients/${editingClientId}/onboarding`
                : "/api/agency/onboarding";
            const method = isEditing ? "PUT" : "POST";

            const res  = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                setSubmitError(data.error || "Erro ao cadastrar cliente.");
                return;
            }
            setResult(data);
        } catch (err: any) {
            setSubmitError(err.message || "Erro de conexão.");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Loading screen ────────────────────────────────────────────────────────
    if (loadingEdit) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6">
                <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="text-emerald-400 animate-spin" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Carregando dados do cliente...</h2>
                    <p className="text-gray-400 text-sm">Por favor, aguarde.</p>
                </div>
            </div>
        );
    }

    // ─── Success screen ────────────────────────────────────────────────────────
    if (result) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6">
                <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="text-emerald-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{isEditing ? 'Cliente atualizado!' : 'Cliente cadastrado!'}</h2>
                    <p className="text-gray-400 mb-6">
                        O cliente, o bot e o Chatwoot foram configurados automaticamente.
                    </p>

                    <div className="bg-[#0b0f1a] rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
                        <InfoRow label="E-mail" value={form.clientEmail} />
                        <InfoRow label="Senha temporária" value={result.tempPassword} mono />
                        <InfoRow label="Bot criado" value={result.template?.label || form.niche} />
                        <InfoRow label="Etapas CRM" value={`${result.template?.stagesCreated ?? 0} criadas`} />
                        {result.chatwootProvisioned && (
                            <InfoRow label="Chatwoot" value={`✅ Conta #${result.chatwootAccountId} provisionada`} />
                        )}
                        {!result.chatwootProvisioned && (
                            <InfoRow label="Chatwoot" value="⚠️ Não configurado (GlobalConfig ausente)" />
                        )}
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push(`/dashboard/agency/clients/${result.clientId}`)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Ver Cliente
                        </button>
                        <button
                            onClick={() => router.push("/dashboard/agency/clients")}
                            className="bg-[#1a2235] hover:bg-[#243049] text-gray-300 px-5 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
                        >
                            Lista de Clientes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Wizard shell ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0b0f1a] flex flex-col">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#111827] px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles size={20} className="text-emerald-400" />
                            {isEditing ? 'Editar Onboarding' : 'Novo Cliente'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {isEditing
                                ? 'Revise e atualize os dados do cliente e suas configurações.'
                                : 'Configure tudo de uma vez — bot, CRM e Chatwoot são criados automaticamente.'
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/agency/clients")}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>

            {/* Step indicator */}
            <div className="border-b border-white/5 bg-[#111827]/50 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active   = step === s.id;
                            const done     = step > s.id;
                            return (
                                <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => done && setStep(s.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            active ? "bg-emerald-600 text-white" :
                                            done   ? "bg-emerald-900/40 text-emerald-400 cursor-pointer hover:bg-emerald-900/60" :
                                                     "bg-white/5 text-gray-500 cursor-default"
                                        }`}
                                    >
                                        <Icon size={12} />
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </button>
                                    {i < STEPS.length - 1 && (
                                        <ChevronRight size={12} className={`text-gray-600 flex-shrink-0 ${done ? "text-emerald-700" : ""}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <StepContent
                        step={step}
                        form={form}
                        set={set}
                        toggleArr={toggleArr}
                        addChannel={addChannel}
                        removeChannel={removeChannel}
                        updateChannel={updateChannel}
                        errors={errors}
                        previewLoading={previewLoading}
                        previewDone={previewDone}
                        onPreviewSite={handlePreviewSite}
                    />

                    {submitError && (
                        <div className="mt-4 flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                            <AlertCircle size={16} />
                            {submitError}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-8 flex items-center justify-between">
                        <button
                            onClick={back}
                            disabled={step === 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} /> Anterior
                        </button>

                        <span className="text-xs text-gray-600">
                            Passo {step} de {STEPS.length}
                        </span>

                        {step < 7 ? (
                            <button
                                onClick={next}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                                Próximo <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60"
                            >
                                {submitting ? (
                                    <><Loader2 size={16} className="animate-spin" /> Criando...</>
                                ) : (
                                    <><Zap size={16} /> Criar Cliente</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Step content router ───────────────────────────────────────────────────────
function StepContent({ step, form, set, toggleArr, addChannel, removeChannel, updateChannel, errors, previewLoading, previewDone, onPreviewSite }: any) {
    switch (step) {
        case 1: return <Step1Negocio      form={form} set={set} errors={errors} previewLoading={previewLoading} previewDone={previewDone} onPreviewSite={onPreviewSite} />;
        case 2: return <Step2Publico      form={form} set={set} />;
        case 3: return <Step3Produtos     form={form} set={set} />;
        case 4: return <Step4Canais       form={form} set={set} addChannel={addChannel} removeChannel={removeChannel} updateChannel={updateChannel} />;
        case 5: return <Step5Financeiro   form={form} set={set} toggleArr={toggleArr} />;
        case 6: return <Step6IA           form={form} set={set} toggleArr={toggleArr} />;
        case 7: return <Step7Acesso       form={form} set={set} errors={errors} />;
        default: return null;
    }
}

// ─── Steps ─────────────────────────────────────────────────────────────────────
function Step1Negocio({ form, set, errors, previewLoading, previewDone, onPreviewSite }: any) {
    return (
        <div className="space-y-6">
            <StepHeader icon={Building2} title="Informações do Negócio" desc="Conte sobre a empresa do cliente. Se tiver site, detectamos tudo automaticamente." />

            {/* Website auto-fill */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Globe size={13} className="inline mr-1.5 text-emerald-400" />
                    Site / URL (opcional)
                </label>
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={form.websiteUrl}
                        onChange={e => set("websiteUrl", e.target.value)}
                        placeholder="https://exemplo.com.br"
                        className="flex-1 bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={onPreviewSite}
                        disabled={!form.websiteUrl || previewLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {previewLoading
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Sparkles size={14} />
                        }
                        {previewLoading ? "Detectando..." : "Auto-preencher"}
                    </button>
                </div>
                {previewDone && (
                    <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Campos preenchidos automaticamente. Revise e ajuste se necessário.
                    </p>
                )}
            </div>

            <Field label="Nome da Empresa *" error={errors.businessName}>
                <input
                    type="text"
                    value={form.businessName}
                    onChange={e => set("businessName", e.target.value)}
                    placeholder="Ex: Pizzaria do João"
                    className={fieldCls(!!errors.businessName)}
                />
            </Field>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nicho / Segmento</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {NICHES.map(n => (
                        <button
                            key={n.value}
                            type="button"
                            onClick={() => set("niche", n.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                                form.niche === n.value
                                    ? "bg-emerald-900/50 border-emerald-500 text-emerald-300"
                                    : "bg-[#1a2235] border-white/10 text-gray-400 hover:border-white/20"
                            }`}
                        >
                            {n.label}
                        </button>
                    ))}
                </div>
            </div>

            <Field label="Descrição do Negócio">
                <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    placeholder="Breve descrição do que a empresa faz..."
                    className={fieldCls(false) + " resize-none"}
                />
            </Field>

            <Field label={<><MapPin size={13} className="inline mr-1 text-gray-400" />Endereço</>}>
                <input
                    type="text"
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                    placeholder="Ex: Rua das Flores, 123 – São Paulo, SP"
                    className={fieldCls(false)}
                />
            </Field>
        </div>
    );
}

function Step2Publico({ form, set }: any) {
    const tones = ["Profissional", "Descontraído", "Técnico", "Empático", "Vendedor"];
    return (
        <div className="space-y-6">
            <StepHeader icon={Users} title="Público-alvo" desc="Quem é o cliente ideal? Isso molda toda a comunicação do bot." />

            <Field label="Público-alvo">
                <textarea
                    rows={3}
                    value={form.targetAudience}
                    onChange={e => set("targetAudience", e.target.value)}
                    placeholder="Ex: Mulheres de 25-45 anos, donas de casa ou trabalhadoras, que buscam praticidade..."
                    className={fieldCls(false) + " resize-none"}
                />
            </Field>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tom de Voz do Bot</label>
                <div className="flex flex-wrap gap-2">
                    {tones.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => set("tone", t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                form.tone === t
                                    ? "bg-emerald-900/50 border-emerald-500 text-emerald-300"
                                    : "bg-[#1a2235] border-white/10 text-gray-400 hover:border-white/20"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <Field label="Persona do Bot (opcional)" note="Como o bot se apresenta (ex: 'Ana, especialista em beleza')">
                <input
                    type="text"
                    value={form.persona}
                    onChange={e => set("persona", e.target.value)}
                    placeholder="Ex: Carla, consultora de beleza da Estética Silva"
                    className={fieldCls(false)}
                />
            </Field>
        </div>
    );
}

function Step3Produtos({ form, set }: any) {
    return (
        <div className="space-y-6">
            <StepHeader icon={Package} title="Produtos & Serviços" desc="O que a empresa oferece? O bot usará isso para conversar com leads." />

            <Field label="Produtos / Serviços Principais">
                <textarea
                    rows={4}
                    value={form.productsServices}
                    onChange={e => set("productsServices", e.target.value)}
                    placeholder="Ex: Corte feminino R$60, Coloração a partir de R$150, Hidratação R$80..."
                    className={fieldCls(false) + " resize-none"}
                />
            </Field>

            <Field label="Diferenciais Competitivos">
                <textarea
                    rows={3}
                    value={form.differentials}
                    onChange={e => set("differentials", e.target.value)}
                    placeholder="Ex: 20 anos de experiência, atendimento em domicílio, parceria com fornecedores premium..."
                    className={fieldCls(false) + " resize-none"}
                />
            </Field>

            <Field label="Principais Destaques / Itens Mais Vendidos">
                <input
                    type="text"
                    value={form.keyProducts}
                    onChange={e => set("keyProducts", e.target.value)}
                    placeholder="Ex: Escova progressiva, Pacote noiva, Combo dia da beleza"
                    className={fieldCls(false)}
                />
            </Field>
        </div>
    );
}

function Step4Canais({ form, set, addChannel, removeChannel, updateChannel }: any) {
    const [newProviderDropdown, setNewProviderDropdown] = useState("");

    const handleAddChannel = (provider: string) => {
        if (!provider) return;
        addChannel(provider);
        setNewProviderDropdown("");
    };

    return (
        <div className="space-y-6">
            <StepHeader icon={Phone} title="Canais de Atendimento" desc="Configure todos os canais por onde o bot vai atender." />

            {/* Canais adicionados */}
            {form.channels.length > 0 && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Canais Configurados</label>
                    {form.channels.map((channel: any, idx: number) => {
                        const provider = CHANNEL_PROVIDERS.find(p => p.value === channel.provider);
                        return (
                            <div key={idx} className="flex gap-2 items-end">
                                <div className="flex-1 flex flex-col gap-1">
                                    <label className="text-xs text-gray-400">{provider?.label}</label>
                                    <input
                                        type="text"
                                        value={channel.identifier}
                                        onChange={e => updateChannel(idx, e.target.value)}
                                        placeholder={provider?.placeholder}
                                        className={fieldCls(false)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeChannel(idx)}
                                    className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors"
                                    title="Remover canal"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add novo canal */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adicionar novo canal</label>
                <div className="flex gap-2">
                    <select
                        value={newProviderDropdown}
                        onChange={e => setNewProviderDropdown(e.target.value)}
                        className={fieldCls(false)}
                    >
                        <option value="">Selecione um canal...</option>
                        {CHANNEL_PROVIDERS.filter(p => !form.channels.some((c: any) => c.provider === p.value)).map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => handleAddChannel(newProviderDropdown)}
                        disabled={!newProviderDropdown}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        <Plus size={14} /> Adicionar
                    </button>
                </div>
            </div>

            {form.channels.length === 0 && (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                    📌 Adicione pelo menos um canal para que o bot possa atender.
                </div>
            )}

            <Field label={<><Clock size={13} className="inline mr-1 text-gray-400" />Horário de Funcionamento</>}>
                <input
                    type="text"
                    value={form.hours}
                    onChange={e => set("hours", e.target.value)}
                    placeholder="Ex: Seg–Sex 8h–18h, Sáb 9h–13h"
                    className={fieldCls(false)}
                />
            </Field>
        </div>
    );
}

function Step5Financeiro({ form, set, toggleArr }: any) {
    return (
        <div className="space-y-6">
            <StepHeader icon={DollarSign} title="Financeiro" desc="Formas de pagamento e ticket médio." />

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Formas de Pagamento Aceitas</label>
                <div className="flex flex-wrap gap-2">
                    {PAYMENT_OPTIONS.map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => toggleArr("paymentMethods", p)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                form.paymentMethods.includes(p)
                                    ? "bg-emerald-900/50 border-emerald-500 text-emerald-300"
                                    : "bg-[#1a2235] border-white/10 text-gray-400 hover:border-white/20"
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <Field label={<><Tag size={13} className="inline mr-1 text-gray-400" />Ticket Médio</>}
                   note="Valor médio que cada cliente gasta">
                <input
                    type="text"
                    value={form.avgTicket}
                    onChange={e => set("avgTicket", e.target.value)}
                    placeholder="Ex: R$ 150"
                    className={fieldCls(false)}
                />
            </Field>
        </div>
    );
}

function Step6IA({ form, set, toggleArr }: any) {
    return (
        <div className="space-y-6">
            <StepHeader icon={Bot} title="IA do Bot" desc="Defina o nome, a personalidade e os módulos do agente." />

            <Field label="Nome do Agente">
                <input
                    type="text"
                    value={form.botName}
                    onChange={e => set("botName", e.target.value)}
                    placeholder="Ex: Ana – Atendente Digital da Estética Silva"
                    className={fieldCls(false)}
                />
            </Field>

            <Field label="Personalidade / Instruções (opcional)"
                   note="Deixe em branco para usar o template do nicho">
                <textarea
                    rows={5}
                    value={form.systemPrompt}
                    onChange={e => set("systemPrompt", e.target.value)}
                    placeholder="Você é Ana, especialista em beleza da Estética Silva. Responda de forma simpática e profissional. Apresente os serviços, agende consultas e qualifique leads..."
                    className={fieldCls(false) + " resize-none font-mono text-xs"}
                />
            </Field>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Módulos Habilitados</label>
                <div className="grid grid-cols-2 gap-2">
                    {MODULE_OPTIONS.map(m => {
                        const Icon = m.icon;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleArr("modules", m.id)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                                    form.modules.includes(m.id)
                                        ? "bg-emerald-900/40 border-emerald-500/60 text-emerald-300"
                                        : "bg-[#1a2235] border-white/10 text-gray-400 hover:border-white/20"
                                }`}
                            >
                                <Icon size={14} />
                                {m.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function Step7Acesso({ form, set, errors }: any) {
    return (
        <div className="space-y-6">
            <StepHeader icon={Shield} title="Credenciais de Acesso" desc="Dados de login do cliente. Uma senha temporária será gerada." />

            <div className="grid sm:grid-cols-2 gap-4">
                <Field label={<><User size={13} className="inline mr-1 text-gray-400" />Nome do Responsável *</>}
                       error={errors.clientName}>
                    <input
                        type="text"
                        value={form.clientName}
                        onChange={e => set("clientName", e.target.value)}
                        placeholder="Ex: João Silva"
                        className={fieldCls(!!errors.clientName)}
                    />
                </Field>

                <Field label={<><Mail size={13} className="inline mr-1 text-gray-400" />E-mail *</>}
                       error={errors.clientEmail}>
                    <input
                        type="email"
                        value={form.clientEmail}
                        onChange={e => set("clientEmail", e.target.value)}
                        placeholder="cliente@email.com"
                        className={fieldCls(!!errors.clientEmail)}
                    />
                </Field>

                <Field label={<><Phone size={13} className="inline mr-1 text-gray-400" />Telefone / WhatsApp *</>}
                       error={errors.clientPhone}>
                    <input
                        type="tel"
                        value={form.clientPhone}
                        onChange={e => set("clientPhone", e.target.value)}
                        placeholder="11999887766"
                        className={fieldCls(!!errors.clientPhone)}
                    />
                </Field>

                <Field label="CPF / CNPJ (para faturas)">
                    <input
                        type="text"
                        value={form.clientCpfCnpj}
                        onChange={e => set("clientCpfCnpj", e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className={fieldCls(false)}
                    />
                </Field>
            </div>

            {/* Review summary */}
            <div className="bg-[#111827] border border-white/10 rounded-xl p-4 space-y-2 text-sm">
                <p className="text-gray-400 font-medium mb-3">Resumo do Onboarding</p>
                <SummaryRow label="Empresa"    value={form.businessName  || "—"} />
                <SummaryRow label="Nicho"      value={NICHES.find(n => n.value === form.niche)?.label || form.niche} />
                <SummaryRow label="Bot"        value={form.botName       || `Bot ${form.businessName || "sem nome"}`} />
                <SummaryRow label="Tom"        value={form.tone          || "Profissional"} />
                <SummaryRow label="Módulos"    value={form.modules.join(", ") || "crm"} />
                <SummaryRow label="Pagamentos" value={form.paymentMethods.join(", ") || "—"} />
                <SummaryRow label="Horário"    value={form.hours         || "—"} />
                {form.channels.length > 0 && (
                    <div className="pt-1">
                        <p className="text-gray-500 text-xs font-medium mb-1">Canais:</p>
                        <div className="flex flex-wrap gap-1">
                            {form.channels.map((ch: any) => {
                                const provider = CHANNEL_PROVIDERS.find(p => p.value === ch.provider);
                                return (
                                    <span key={`${ch.provider}-${ch.identifier}`} className="inline-block bg-emerald-900/30 border border-emerald-500/30 rounded px-2 py-0.5 text-xs text-emerald-300">
                                        {provider?.label} {ch.identifier && `(${ch.identifier})`}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
                {form.websiteUrl && <SummaryRow label="Site" value={form.websiteUrl} />}
                <div className="pt-2 border-t border-white/5 mt-2 text-xs text-emerald-400/80 flex items-center gap-1.5">
                    <Sparkles size={11} />
                    Bot, CRM, regras de follow-up, canais e conta Chatwoot serão criados automaticamente.
                </div>
            </div>
        </div>
    );
}

// ─── Tiny reusable primitives ──────────────────────────────────────────────────
function StepHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-3 pb-2">
            <div className="w-10 h-10 bg-emerald-900/40 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-emerald-400" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="text-sm text-gray-500">{desc}</p>
            </div>
        </div>
    );
}

function Field({ label, children, error, note }: { label: any; children: React.ReactNode; error?: string; note?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
            {children}
            {note  && <p className="mt-1 text-xs text-gray-500">{note}</p>}
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-gray-500">{label}</span>
            <span className={`text-white font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</span>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-300 text-right max-w-[60%] truncate">{value}</span>
        </div>
    );
}

const fieldCls = (hasError: boolean) =>
    `w-full bg-[#1a2235] border ${hasError ? "border-red-500" : "border-white/10"} rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none transition-colors`;
