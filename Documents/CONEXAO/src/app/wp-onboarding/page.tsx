"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Check, Loader2, Rocket, Shield, Zap, CreditCard, UserPlus, LogIn, ArrowRight, LayoutDashboard, MessageSquare, X } from "lucide-react";

type Step = 'auth' | 'plan' | 'ready';

export default function WpOnboardingPage() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const searchParams = useSearchParams();
    const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'auth');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState<'login' | 'register'>('register');
    const [plans, setPlans] = useState<any[]>([]);
    const [interval, setInterval] = useState<'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'>('MONTHLY');

    // Auth Form State
    const [form, setForm] = useState({ 
        name: "", 
        email: "", 
        password: "", 
        whatsapp: "", 
        cpfCnpj: "" 
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // 1. Fetch real plans from API
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch("/api/plans");
                const data = await res.json();
                if (data.plans) {
                    setPlans(data.plans);
                }
            } catch (err) {
                console.error("Failed to fetch plans:", err);
            }
        };
        fetchPlans();
    }, []);

    // 2. Auto-jump if already logged in (Only if it's the auth step)
    useEffect(() => {
        if (sessionStatus === 'authenticated' && step === 'auth') {
            checkStatus(session.user?.email || "");
        }
    }, [sessionStatus, step]);

    const [userName, setUserName] = useState("");
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [details, setDetails] = useState("");

    const checkStatus = async (email: string) => {
        setLoading(true);
        setDetails("");
        try {
            const res = await fetch(`/api/v1/wp/auth?email=${email}`);
            const data = await res.json();
            
            if (data.token) {
                setTenantToken(data.token);
                const statusRes = await fetch("/api/v1/wp/me", {
                    headers: { "Authorization": `Bearer ${data.token}` }
                });
                const statusData = await statusRes.json();
                
                if (!statusRes.ok) {
                    // Se estiver autenticado mas o token do WP falhar (tenant não existe ou erro), 
                    // não trava no loading, deixa o usuário tentar logar manualmente se quiser
                    setLoading(false);
                    return;
                }

                setUserName(statusData.name);
                setDebugInfo(statusData.debug);

                if (statusData.hasPlan) {
                    handleFinish(data.token);
                } else {
                    setStep('plan');
                }
            }
        } catch (err: any) {
            console.error("Status Check Error:", err);
            setError("Erro ao verificar status");
            setDetails(err.message || "");
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/v1/wp/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: mode,
                    ...form
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro na autenticação");
            }

            // Success! Store token and check profile
            setTenantToken(data.token);
            
            const statusRes = await fetch("/api/v1/wp/me", {
                headers: { "Authorization": `Bearer ${data.token}` }
            });
            const statusData = await statusRes.json();

            if (!statusRes.ok) {
                setError(statusData.error || "Erro ao validar conta");
                setDetails(statusData.details || "");
                return;
            }

            if (statusData.hasPlan) {
                handleFinish(data.token);
            } else {
                setStep('plan');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [tenantToken, setTenantToken] = useState("");

    const handleFinish = (finalToken: string) => {
        setTenantToken(finalToken);
        // Post message to parent WordPress
        if (typeof window !== 'undefined') {
            window.parent.postMessage({
                type: 'CONEXBOT_AUTH',
                token: finalToken
            }, '*');
        }
        setStep('ready');
    };


    // Robustness: retry postMessage in ready step
    useEffect(() => {
        if (step === 'ready' && tenantToken) {
            const timer = setTimeout(() => {
                window.parent.postMessage({
                    type: 'CONEXBOT_AUTH',
                    token: tenantToken
                }, '*');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [step, tenantToken]);

    // Handle Google Login via Popup (to avoid Iframe 403)
    const handleGoogleLogin = () => {
        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
            '/auth/google-popup', 
            'GoogleLogin', 
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    // Listen for popup messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                // Refresh session or just check status
                if (session?.user?.email) {
                    checkStatus(session.user.email);
                } else {
                    // If session not yet updated in this window, we can poll or wait
                    window.location.reload();
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [session]);

    if (sessionStatus === 'loading') {
        return (
            <div className="min-h-screen bg-[#070708] flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(88,28,135,0.15),transparent)]">
            <div className={`w-full transition-all duration-700 ${step === 'plan' ? 'max-w-7xl' : 'max-w-xl'}`}>
                
                {/* Site-Perfect Logo Section */}
                <div className="flex flex-col items-center mb-10 text-center animate-in fade-in zoom-in duration-700">
                    <div className="text-center mb-2">
                        <div className="text-3xl font-bold tracking-tighter">
                            Conext <span className="text-gradient">Bot</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">
                        Crie sua conta e comece a automatizar.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 px-8 relative max-w-sm mx-auto">
                    <div className="absolute top-1/2 left-8 right-8 h-px bg-white/5 -translate-y-1/2 z-0" />
                    {[
                        { id: 'auth', icon: UserPlus, label: 'Conta' },
                        { id: 'plan', icon: CreditCard, label: 'Plano' },
                        { id: 'ready', icon: LayoutDashboard, label: 'Pronto' }
                    ].map((s, idx) => {
                        const active = step === s.id;
                        const completed = (step === 'plan' && s.id === 'auth') || (step === 'ready');
                        return (
                            <div key={s.id} className="relative z-10 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                    ${active ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-500/30 scale-110' : 
                                      completed ? 'bg-green-500 border-green-500' : 'bg-[#0a0a0c] border-white/10 text-gray-500'}`}>
                                    {completed ? <Check size={14} className="text-white" /> : <s.icon size={14} />}
                                </div>
                                <span className={`text-[9px] mt-2 font-black uppercase tracking-widest ${active ? 'text-white' : 'text-gray-500'}`}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="glass rounded-[2.5rem] p-8 border border-white/5 shadow-2xl bg-[#0a0a0c]/50 backdrop-blur-3xl transition-all duration-500 min-h-[460px] flex flex-col">
                    
                    {step === 'auth' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-1">Boas-vindas!</h2>
                                <p className="text-gray-400 text-xs">Identifique-se para gerenciar seus robôs no WordPress.</p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-3.5 flex-1">
                                {mode === 'register' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-wider">Nome Completo</label>
                                            <input 
                                                required
                                                type="text" 
                                                name="name"
                                                placeholder="João Silva"
                                                value={form.name}
                                                onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-wider">CPF ou CNPJ</label>
                                            <input 
                                                required={mode === 'register'}
                                                type="text" 
                                                name="cpfCnpj"
                                                placeholder="000.000.000-00"
                                                value={form.cpfCnpj}
                                                onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08] font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-wider">E-mail Profissional</label>
                                    <input 
                                        required
                                        type="email" 
                                        name="email"
                                        placeholder="seu@email.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-wider">Senha</label>
                                        <input 
                                            required
                                            type="password" 
                                            name="password"
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-wider">WhatsApp</label>
                                        <input 
                                            required={mode === 'register'}
                                            type="tel" 
                                            name="whatsapp"
                                            placeholder="(11) 99999-9999"
                                            value={form.whatsapp}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold flex items-center gap-2">
                                        <Shield size={14} className="shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button 
                                    disabled={loading}
                                    className="w-full btn-primary h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 active:scale-[0.98] transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            {mode === 'register' ? 'Criar Minha Conta' : 'Acessar Painel'}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6">
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-white/5"></div>
                                    <span className="flex-shrink mx-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Ou continue com</span>
                                    <div className="flex-grow border-t border-white/5"></div>
                                </div>

                                <button 
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full mt-4 flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="text-sm font-bold text-white group-hover:text-purple-400">
                                        {mode === 'register' ? 'Criar conta com Google' : 'Entrar com Google'}
                                    </span>
                                </button>
                                
                                <p className="mt-6 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    {mode === 'register' ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                                    <button 
                                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                        className="ml-2 text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        {mode === 'register' ? 'Fazer Login' : 'Cadastre-se'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'plan' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col text-center">
                            <div className="mb-8">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto border border-amber-500/20 mb-4">
                                    <Zap className="text-amber-500 w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black mb-1">Passo Final: Ativação</h2>
                                <p className="text-gray-400 text-xs px-10">Escolha o plano ideal e libere sua inteligência artificial.</p>
                            </div>

                            {/* Interval Toggle */}
                            <div className="flex justify-center mb-8 px-2">
                                <div className="p-1 rounded-2xl border border-white/5 flex gap-1 overflow-x-auto no-scrollbar max-w-full bg-white/5 backdrop-blur-md">
                                    {[
                                        { id: 'MONTHLY', label: 'Mensal' },
                                        { id: 'QUARTERLY', label: 'Trimestral' },
                                        { id: 'SEMIANNUAL', label: 'Semestral' },
                                        { id: 'YEARLY', label: 'Anual' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setInterval(opt.id as any)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${interval === opt.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-start">
                                {plans.length > 0 ? (
                                    plans.map((p, idx) => {
                                        const baseMonthPrice = Number(p.price) || 0;
                                        let currentPrice = baseMonthPrice;
                                        let originalPrice = baseMonthPrice * 1.25; 
                                        let periodLabel = 'mês';

                                        if (interval === 'QUARTERLY') {
                                            currentPrice = p.priceQuarterly !== null && p.priceQuarterly !== undefined ? Number(p.priceQuarterly) : (baseMonthPrice * 3);
                                            originalPrice = (baseMonthPrice * 3) * 1.2;
                                            periodLabel = 'trimestre';
                                        } else if (interval === 'SEMIANNUAL') {
                                            currentPrice = p.priceSemiannual !== null && p.priceSemiannual !== undefined ? Number(p.priceSemiannual) : (baseMonthPrice * 6);
                                            originalPrice = (baseMonthPrice * 6) * 1.25;
                                            periodLabel = 'semestre';
                                        } else if (interval === 'YEARLY') {
                                            currentPrice = p.priceYearly !== null && p.priceYearly !== undefined ? Number(p.priceYearly) : (baseMonthPrice * 12);
                                            originalPrice = (baseMonthPrice * 12) * 1.35;
                                            periodLabel = 'ano';
                                        }

                                        const discountPercent = Math.round((1 - (currentPrice / originalPrice)) * 100);
                                        const isFeatured = idx === 1;

                                        return (
                                            <div 
                                                key={p.id}
                                                className={`p-6 rounded-[2rem] border relative transition-all duration-500 hover:scale-[1.02] flex flex-col h-full text-left bg-white/[0.03] backdrop-blur-sm ${isFeatured ? 'border-purple-500/30 bg-purple-500/[0.05] shadow-2xl' : 'border-white/5'}`}
                                            >
                                                {isFeatured && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                        Mais Popular
                                                    </div>
                                                )}

                                                <h3 className={`text-lg font-bold mb-1 tracking-tight ${isFeatured ? 'text-purple-400' : 'text-white'}`}>{p.name}</h3>
                                                
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] text-gray-500 line-through">
                                                        R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                    </span>
                                                    <span className="bg-green-500/20 text-green-400 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                                        -{discountPercent}%
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline gap-1 mb-4">
                                                    <span className="text-xs text-gray-500 font-medium tracking-tight">R$</span>
                                                    <span className="text-3xl font-black text-white tracking-tighter">
                                                        {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                                                    </span>
                                                    <span className="text-[10px] font-normal text-gray-500 uppercase tracking-widest ml-1">/{periodLabel}</span>
                                                </div>
                                                
                                                <p className="text-[10px] text-gray-500 mb-6 leading-relaxed line-clamp-2 h-8">{p.description}</p>

                                                <ul className="space-y-3 mb-8 text-[11px] text-gray-300 flex-grow">
                                                    <li className="flex gap-2.5 items-center italic">
                                                        <Check size={12} className="text-purple-500" />
                                                        <span className="font-medium text-white">{p.botLimit} {p.botLimit === 1 ? 'Agente de IA' : 'Agentes de IA'}</span>
                                                    </li>
                                                    <li className="flex gap-2.5 items-center italic">
                                                        <Check size={12} className="text-purple-500" />
                                                        <span className="font-medium text-white">{p.messageLimit === 0 ? 'Conversas Ilimitadas' : `${p.messageLimit.toLocaleString()} Mensagens`}</span>
                                                    </li>
                                                    {(p.features || []).map((feature: any, fIdx: number) => (
                                                        <li key={fIdx} className={`flex gap-2.5 items-center italic ${!feature.enabled ? 'opacity-30' : ''}`}>
                                                            {feature.enabled ? (
                                                                <Check size={12} className="text-purple-500" />
                                                            ) : (
                                                                <X size={12} className="text-gray-600" />
                                                            )}
                                                            <span className={feature.enabled ? 'text-gray-300' : ''}>{feature.text}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button 
                                                    onClick={() => window.open(`${window.location.origin}/api/checkout/portal?planId=${p.id}&interval=${interval}&gateway=asaas`, '_blank')}
                                                    className={`w-full py-3 rounded-xl text-center font-black text-[10px] uppercase tracking-widest transition-all ${isFeatured ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'}`}
                                                >
                                                    Assinar Agora
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-10 text-gray-500 text-sm italic">
                                        {loading ? "Carregando planos..." : "Nenhum plano disponível no momento."}
                                    </div>
                                )}
                            </div>

                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-relaxed px-10">
                                Após a confirmação, o WordPress será <br/>habilitado automaticamente.
                            </p>
                        </div>
                    )}


                    {step === 'ready' && (
                        <div className="animate-in zoom-in-95 fade-in duration-700 h-full flex flex-col items-center justify-center text-center py-8">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                                <Check size={40} className="text-green-500 relative z-10" />
                            </div>
                            <h2 className="text-2xl font-black mb-2 text-white italic">Foguete Conectado! 🚀</h2>
                            <p className="text-gray-400 text-sm max-w-xs mb-8">
                                Sua inteligência artificial está ativa. Se não for redirecionado em instantes, clique no botão abaixo.
                            </p>
                            
                            <button 
                                onClick={() => handleFinish(tenantToken)}
                                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-green-500/20 mb-6"
                            >
                                Prosseguir para o Dashboard
                            </button>

                            <div className="w-full max-w-xs p-4 bg-white/5 rounded-2xl border border-white/5 text-left mb-6">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                    Conexão Manual (Obrigatória se o botão falhar)
                                </p>
                                <p className="text-[#9ea0a3] text-[10px] leading-relaxed mb-3">
                                    Copie o código abaixo e cole nas configurações do Plugin no seu WordPress:
                                </p>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={tenantToken || ""}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] font-mono text-gray-400 focus:outline-none"
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(tenantToken || "");
                                            alert("Código Copiado!");
                                        }}
                                        className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Sincronização em tempo real ativa</span>
                            </div>
                        </div>
                    )}

                </div>

                {/* Secure Badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
                    <Shield size={12} className="text-gray-700" />
                    Secure Sandbox Environment
                </div>
            </div>

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
