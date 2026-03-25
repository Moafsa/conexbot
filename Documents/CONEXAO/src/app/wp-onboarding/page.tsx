"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Rocket, Shield, Zap, CreditCard, UserPlus, LogIn, ArrowRight, LayoutDashboard, MessageSquare } from "lucide-react";

type Step = 'auth' | 'plan' | 'ready';

export default function WpOnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'auth');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [token, setToken] = useState<string | null>(searchParams.get('token'));
    const [mode, setMode] = useState<'login' | 'register'>('register');

    // Auth Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

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
                    email,
                    password,
                    name
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro na autenticação");
            }

            setToken(data.token);
            
            // Check if user already has a plan (for login)
            const statusRes = await fetch("/api/v1/wp/me", {
                headers: { "Authorization": `Bearer ${data.token}` }
            });
            const statusData = await statusRes.json();

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

    const handleFinish = (finalToken: string) => {
        window.parent.postMessage({
            type: 'CONEXBOT_AUTH',
            token: finalToken
        }, '*');
        setStep('ready');
    };

    return (
        <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(88,28,135,0.1),transparent)]">
            <div className="w-full max-w-xl">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-4 animate-float">
                        <Rocket className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter mb-2">
                        CONEXT<span className="text-purple-500">.click</span>
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xs">
                        Inteligência Artificial & CRM para seu WhatsApp e WooCommerce.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 px-8 relative">
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
                                <span className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${active ? 'text-white' : 'text-gray-500'}`}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="glass rounded-[2rem] p-8 border border-white/5 shadow-2xl bg-[#0a0a0c]/50 backdrop-blur-xl transition-all duration-500 min-h-[400px] flex flex-col">
                    
                    {step === 'auth' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-2">Comece por aqui</h2>
                                <p className="text-gray-400 text-sm">Entre na sua conta ou crie uma nova em segundos.</p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4 flex-1">
                                {mode === 'register' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Seu nome"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail</label>
                                    <input 
                                        required
                                        type="email" 
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
                                    <input 
                                        required
                                        type="password" 
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all focus:bg-white/[0.08]"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2">
                                        <Shield size={14} className="shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button 
                                    disabled={loading}
                                    className="w-full btn-primary h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 active:scale-[0.98] transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            {mode === 'register' ? 'Criar Conta' : 'Acessar Painel'}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-white/5 text-center">
                                <p className="text-xs text-gray-500">
                                    {mode === 'register' ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                                    <button 
                                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                        className="ml-2 text-purple-400 font-bold hover:text-purple-300 transition-colors"
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
                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                                    <Zap className="text-amber-500 w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Escolha um Plano</h2>
                                <p className="text-gray-400 text-sm max-w-sm mx-auto">Para começar a disparar suas automações, você precisa de um plano ativo.</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left flex items-center justify-between group hover:border-purple-500/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">S</div>
                                        <div>
                                            <h4 className="font-bold text-white leading-none mb-1">Starter</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">5.000 Mensagens/mês</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white leading-none">R$ 97</p>
                                        <p className="text-[10px] text-gray-500">/mês</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left flex items-center justify-between group hover:border-purple-500/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">A</div>
                                        <div>
                                            <h4 className="font-bold text-white leading-none mb-1">Advanced</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">15.000 Mensagens/mês</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white leading-none">R$ 147</p>
                                        <p className="text-[10px] text-gray-500">/mês</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <button 
                                    onClick={() => window.open('https://conext.click/pricing', '_blank')}
                                    className="w-full btn-primary h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-4 group"
                                >
                                    Ver Todos os Planos no Site
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                                    Após assinar, volte aqui para <br/>concluir a conexão automática.
                                </p>
                            </div>
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
                                O seu WordPress acaba de ganhar super-poderes. Redirecionando para o seu dashboard...
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sincronização em tempo real ativa</span>
                            </div>
                        </div>
                    )}

                </div>

                {/* Secure Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    <Shield size={12} className="text-gray-700" />
                    Criptografia de Ponta-a-Ponta
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
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
