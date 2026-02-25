"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [form, setForm] = useState({ name: "", email: "", password: "", whatsapp: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

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
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao criar conta");
                return;
            }

            router.push("/auth/login?registered=true");
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
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
