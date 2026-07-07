"use client";

import { useState, useEffect } from "react";
import { 
    ShoppingBag, 
    Plus, 
    Trash2, 
    ExternalLink, 
    Copy, 
    Check, 
    Loader2, 
    ChevronRight, 
    ChevronLeft,
    Sparkles,
    Eye,
    Globe,
    AlertCircle,
    Edit
} from "lucide-react";
import { toast } from "sonner";

export function OffersTab() {
    const [offers, setOffers] = useState<any[]>([]);
    const [bots, setBots] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [generatingCopy, setGeneratingCopy] = useState(false);
    const [savingOffer, setSavingOffer] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: "",
        niche: "Renda Extra",
        price: "37.00",
        originalPrice: "97.00",
        audience: "",
        transformation: "",
        botId: "",
        checkoutUrl: ""
    });

    // Generated Copy state
    const [copy, setCopy] = useState<any>({
        headline: "",
        subheadline: "",
        bullets: ["", "", "", "", ""],
        scarcity: "ATENÇÃO: Preço promocional válido apenas pelas próximas horas.",
        bonuses: [
            { title: "BÔNUS 1: Comunidade Exclusiva", description: "Acesso à comunidade de membros para interagir e tirar dúvidas.", value: "R$ 97,00" },
            { title: "BÔNUS 2: Cronograma Acelerador", description: "O passo a passo diário detalhado para ter resultados rápidos.", value: "R$ 147,00" },
            { title: "BÔNUS 3: Suporte VIP", description: "Tire dúvidas direto com o time técnico.", value: "R$ 47,00" }
        ],
        guarantee: "Garantia incondicional de 7 dias. Se você não gostar do método, devolvemos todo o seu investimento."
    });

    useEffect(() => {
        fetchOffers();
        fetchBots();
    }, []);

    async function fetchOffers() {
        try {
            const res = await fetch("/api/marketing/offer");
            if (res.ok) {
                const data = await res.json();
                setOffers(data);
            }
        } catch (err) {
            console.error("Erro ao buscar ofertas", err);
        } finally {
            setLoadingOffers(false);
        }
    }

    async function fetchBots() {
        try {
            const res = await fetch("/api/bots");
            if (res.ok) {
                const data = await res.json();
                setBots(data);
                if (data.length > 0) {
                    setForm(prev => ({ ...prev, botId: data[0].id }));
                }
            }
        } catch (err) {
            console.error("Erro ao buscar bots", err);
        }
    }

    const handleCopyLink = (slug: string, id: string) => {
        const url = `${window.location.origin}/v/${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success("Link da LP copiado com sucesso!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleGenerateCopy = async () => {
        if (!form.name || !form.transformation || !form.audience || !form.botId) {
            toast.error("Por favor, preencha todos os campos do briefing.");
            return;
        }

        setGeneratingCopy(true);
        try {
            const res = await fetch("/api/marketing/offer/generate-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                const data = await res.json();
                const newCopy = data.copy;
                setCopy({
                    headline: newCopy.headline || "",
                    subheadline: newCopy.subheadline || "",
                    bullets: newCopy.bullets || ["", "", "", "", ""],
                    scarcity: newCopy.scarcity || "Oferta promocional por tempo limitado",
                    bonuses: newCopy.bonuses || [],
                    guarantee: newCopy.guarantee || "Garantia de 7 dias incondicional"
                });
                setWizardStep(2);
            } else {
                const err = await res.json();
                toast.error(err.error || "Falha ao gerar copy.");
            }
        } catch (err) {
            toast.error("Erro ao conectar ao gerador de copy.");
        } finally {
            setGeneratingCopy(false);
        }
    };

    const handleSaveOffer = async () => {
        setSavingOffer(true);
        try {
            const payload = {
                ...form,
                copy: {
                    ...copy,
                    checkoutUrl: form.checkoutUrl
                }
            };

            const res = await fetch("/api/marketing/offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Landing Page criada e publicada!");
                fetchOffers();
                setShowWizard(false);
                setWizardStep(1);
                // reset form
                setForm({
                    name: "",
                    niche: "Renda Extra",
                    price: "37.00",
                    originalPrice: "97.00",
                    audience: "",
                    transformation: "",
                    botId: bots[0]?.id || "",
                    checkoutUrl: ""
                });
            } else {
                toast.error("Erro ao salvar oferta.");
            }
        } catch (err) {
            toast.error("Erro ao conectar ao servidor.");
        } finally {
            setSavingOffer(false);
        }
    };

    const handleDeleteOffer = async (id: string) => {
        if (!confirm("Deseja realmente excluir esta Landing Page?")) return;
        
        try {
            const res = await fetch(`/api/marketing/offer/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("LP excluída com sucesso!");
                fetchOffers();
            } else {
                toast.error("Erro ao excluir LP.");
            }
        } catch (err) {
            toast.error("Erro de conexão ao excluir.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Fábrica de LPs (Ofertas)</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">Crie páginas de vendas de alta conversão usando inteligência artificial</p>
                </div>
                {!showWizard && (
                    <button
                        onClick={() => setShowWizard(true)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
                    >
                        <Plus size={16} />
                        Nova LP (Oferta)
                    </button>
                )}
            </div>

            {/* List View */}
            {!showWizard && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6">
                    {loadingOffers ? (
                        <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-emerald-500" size={24} />
                            <span className="text-xs font-bold uppercase tracking-wider">Buscando páginas de vendas...</span>
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto" />
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Nenhuma LP Criada</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Você ainda não tem ofertas ou páginas de vendas geradas. Clique no botão acima para criar sua primeira oferta de baixo ticket!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {offers.map((offer) => (
                                <div key={offer.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col justify-between min-h-[220px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                {offer.niche}
                                            </span>
                                            <div className="text-[10px] text-gray-600 font-bold uppercase">{offer.bot?.name}</div>
                                        </div>
                                        
                                        <h4 className="text-base font-black text-white uppercase tracking-tight truncate">
                                            {offer.name}
                                        </h4>
                                        
                                        <div className="flex items-baseline gap-1 text-white">
                                            <span className="text-xs font-bold">R$</span>
                                            <span className="text-2xl font-black">{offer.price.toFixed(2)}</span>
                                            {offer.originalPrice && (
                                                <span className="text-xs text-gray-500 line-through font-bold ml-2">
                                                    De R$ {offer.originalPrice.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Links */}
                                    <div className="pt-6 border-t border-white/5 mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <a
                                                href={`/v/${offer.publicSlug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                                title="Visualizar Página Pública"
                                            >
                                                <Eye size={14} />
                                            </a>
                                            <button
                                                onClick={() => handleCopyLink(offer.publicSlug, offer.id)}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                                title="Copiar Link"
                                            >
                                                {copiedId === offer.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleDeleteOffer(offer.id)}
                                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors"
                                            title="Excluir LP"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Creation Wizard View */}
            {showWizard && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full -z-10"></div>
                    
                    {/* Header of Wizard */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                                <Sparkles size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-200 uppercase tracking-widest">Assistente de Criação</h3>
                                <p className="text-[10px] text-gray-500 font-bold">PASSO {wizardStep} DE 3</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowWizard(false); setWizardStep(1); }}
                            className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>

                    {/* Step 1: Briefing do Produto */}
                    {wizardStep === 1 && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h4 className="text-base font-black text-white uppercase tracking-tight mb-2">Briefing do Produto Digital</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Preencha o formulário abaixo. A IA usará essas informações para redigir o copy, bônus, gatilhos de urgência e formatar sua Landing Page completa.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Produto</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Guia Fornecedores da Copa"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nicho / Segmento</label>
                                    <select
                                        value={form.niche}
                                        onChange={(e) => setForm({ ...form, niche: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    >
                                        <option value="Renda Extra" className="bg-[#0b0f1a]">Renda Extra</option>
                                        <option value="Saúde & Bem-estar" className="bg-[#0b0f1a]">Saúde & Bem-estar</option>
                                        <option value="Negócios / Finanças" className="bg-[#0b0f1a]">Negócios / Finanças</option>
                                        <option value="Estética / Beleza" className="bg-[#0b0f1a]">Estética / Beleza</option>
                                        <option value="Idiomas / Educação" className="bg-[#0b0f1a]">Idiomas / Educação</option>
                                        <option value="Desenvolvimento Pessoal" className="bg-[#0b0f1a]">Desenvolvimento Pessoal</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço Promocional (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ex: 37.00"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço Original Riscar (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ex: 97.00"
                                        value={form.originalPrice}
                                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Público-Alvo</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: pessoas comuns que querem ganhar dinheiro revendendo camisetas de time"
                                        value={form.audience}
                                        onChange={(e) => setForm({ ...form, audience: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Principal Transformação/Resultado</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Ex: lucrar revendendo camisetas sem precisar investir em estoque próprio"
                                        value={form.transformation}
                                        onChange={(e) => setForm({ ...form, transformation: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Associar ao Agente IA</label>
                                    <select
                                        value={form.botId}
                                        onChange={(e) => setForm({ ...form, botId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    >
                                        {bots.map(b => (
                                            <option key={b.id} value={b.id} className="bg-[#0b0f1a]">{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link de Checkout (Botão Comprar)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: link da Kiwify, Asaas ou Hotmart"
                                        value={form.checkoutUrl}
                                        onChange={(e) => setForm({ ...form, checkoutUrl: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleGenerateCopy}
                                    disabled={generatingCopy}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] disabled:opacity-50"
                                >
                                    {generatingCopy ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Gerando Copy com IA...
                                        </>
                                    ) : (
                                        <>
                                            Gerar da Oferta com IA
                                            <ChevronRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Edit Generated Copy */}
                    {wizardStep === 2 && (
                        <div className="space-y-6 max-w-3xl">
                            <div>
                                <h4 className="text-base font-black text-white uppercase tracking-tight mb-2">Refinar a Copy do Produto</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Esta é a estrutura textual gerada pela inteligência artificial de acordo com o briefing fornecido. Você pode revisar e modificar os textos antes de publicar.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headline Principal</label>
                                    <textarea
                                        rows={2}
                                        value={copy.headline}
                                        onChange={(e) => setCopy({ ...copy, headline: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none text-white font-black"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subheadline (Promessa secundária)</label>
                                    <textarea
                                        rows={2}
                                        value={copy.subheadline}
                                        onChange={(e) => setCopy({ ...copy, subheadline: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none text-gray-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escassez e Urgência</label>
                                    <input
                                        type="text"
                                        value={copy.scarcity}
                                        onChange={(e) => setCopy({ ...copy, scarcity: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-red-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tópicos/Benefícios do Produto</label>
                                    <div className="space-y-2">
                                        {copy.bullets.map((b: string, idx: number) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                value={b}
                                                onChange={(e) => {
                                                    const newBullets = [...copy.bullets];
                                                    newBullets[idx] = e.target.value;
                                                    setCopy({ ...copy, bullets: newBullets });
                                                }}
                                                placeholder={`Benefício ${idx + 1}`}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500 focus:outline-none transition-colors text-gray-300"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Texto da Garantia</label>
                                    <textarea
                                        rows={2}
                                        value={copy.guarantee}
                                        onChange={(e) => setCopy({ ...copy, guarantee: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between">
                                <button
                                    onClick={() => setWizardStep(1)}
                                    className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-white/5 transition-all"
                                >
                                    <ChevronLeft size={16} />
                                    Voltar
                                </button>
                                <button
                                    onClick={() => setWizardStep(3)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
                                >
                                    Revisar Layout da LP
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Layout Preview & Publish */}
                    {wizardStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-base font-black text-white uppercase tracking-tight mb-2">Revisar e Publicar</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Tudo pronto! Veja abaixo uma simulação simplificada de como sua Landing Page aparecerá publicamente para os compradores antes de clicar em publicar.
                                </p>
                            </div>

                            {/* Minimalist Preview Panel */}
                            <div className="bg-[#070913] border border-white/10 rounded-[32px] p-8 max-w-2xl mx-auto space-y-8 select-none pointer-events-none">
                                <div className="text-center space-y-4">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                                        Método Exclusivo 2026
                                    </span>
                                    <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-snug">
                                        {copy.headline}
                                    </h1>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        {copy.subheadline}
                                    </p>
                                    <div className="bg-red-500/10 text-red-500 font-bold text-[9px] uppercase py-1 px-3 rounded-full inline-block tracking-wider">
                                        {copy.scarcity}
                                    </div>
                                </div>

                                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6">
                                    <h5 className="text-xs font-black text-white uppercase mb-4">O que você vai receber:</h5>
                                    <ul className="space-y-2">
                                        {copy.bullets.filter(Boolean).map((bullet: string, idx: number) => (
                                            <li key={idx} className="flex gap-2 text-[11px]">
                                                <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                                <span className="text-gray-300 font-medium">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="text-center bg-emerald-500/5 border border-emerald-500/15 p-6 rounded-3xl">
                                    <span className="text-[10px] text-gray-500 line-through font-bold">De R$ {parseFloat(form.originalPrice).toFixed(2)}</span>
                                    <div className="text-xl font-black text-white mt-1">Por apenas R$ {parseFloat(form.price).toFixed(2)}</div>
                                    <div className="w-full bg-emerald-500 text-black py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4">
                                        Garantir Meu Acesso
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between">
                                <button
                                    onClick={() => setWizardStep(2)}
                                    className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-white/5 transition-all"
                                >
                                    <ChevronLeft size={16} />
                                    Voltar
                                </button>
                                <button
                                    onClick={handleSaveOffer}
                                    disabled={savingOffer}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                                >
                                    {savingOffer ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Publicando...
                                        </>
                                    ) : (
                                        <>
                                            Publicar e Gerar Link
                                            <Globe size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
