"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
    const [form, setForm] = useState({ name: "", email: "", password: "", whatsapp: "", cpfCnpj: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    const planId = searchParams.get("planId");
    const interval = searchParams.get("interval");
    const trial = searchParams.get("trial");
    const gateway = searchParams.get("gateway");

    useEffect(() => {
        if (!planId) {
            router.push("/pricing");
        }
    }, [planId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    planId,
                    interval,
                    trial
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao criar conta");
                setLoading(false);
                return;
            }

            // Auto login after register
            const loginRes = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (loginRes?.error) {
                router.push("/auth/login?registered=true");
                return;
            }

            // Redirect based on plan selection
            if (trial === 'true' && planId) {
                router.push("/dashboard?welcome=true");
            } else if (planId) {
                router.push(`/api/checkout/portal?planId=${planId}&interval=${interval || 'MONTHLY'}&gateway=${gateway || 'asaas'}`);
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Erro de conexão. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10 animate-float">
                    <Link href="/" className="text-3xl font-bold tracking-tighter">
                        Conext <span className="text-gradient">Bot</span>
                    </Link>
                    <p className="text-gray-500 mt-2">Crie sua conta e comece a automatizar.</p>
                </div>

                <div className="glass p-8 rounded-2xl border-white/10 shadow-2xl">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="João Silva"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Email Profissional
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="joao@empresa.com"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Senha
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                minLength={6}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Mínimo 6 caracteres"
                                value={form.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                CPF ou CNPJ <span className="text-gray-600">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                name="cpfCnpj"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                value={form.cpfCnpj}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                WhatsApp <span className="text-gray-600">(opcional)</span>
                            </label>
                            <input
                                type="tel"
                                name="whatsapp"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="(11) 99999-9999"
                                value={form.whatsapp}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center py-3 mt-2"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Criar Minha Conta"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between">
                        <hr className="w-full border-white/10" />
                        <span className="px-4 text-xs text-gray-500 uppercase tracking-widest">OU</span>
                        <hr className="w-full border-white/10" />
                    </div>

                    <button
                        onClick={() => signIn("google", { callbackUrl: planId ? `/api/checkout/portal?planId=${planId}&interval=${interval || 'MONTHLY'}&gateway=${gateway || 'asaas'}` : "/dashboard" })}
                        className="mt-6 w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm font-medium text-white">Criar conta com Google</span>
                    </button>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        Já tem conta?{" "}
                        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            Fazer login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
