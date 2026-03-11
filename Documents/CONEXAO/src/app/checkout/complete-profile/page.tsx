"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

function CompleteProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const [cpfCnpj, setCpfCnpj] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const callbackUrl = searchParams.get('callbackUrl') || "/dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!cpfCnpj || cpfCnpj.trim() === '') {
            setError("Por favor, preencha o seu CPF ou CNPJ.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Fetch current profile to get other fields instead of sending empty
            const getRes = await fetch("/api/settings/profile");
            const profile = await getRes.json();
            
            if (!getRes.ok) {
                throw new Error("Erro ao carregar perfil");
            }

            const res = await fetch("/api/settings/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profile.name,
                    email: profile.email,
                    whatsapp: profile.whatsapp,
                    cpfCnpj: cpfCnpj
                })
            });
            
            if (!res.ok) throw new Error("Erro ao salvar CPF/CNPJ");
            
            router.push(callbackUrl);
        } catch (err) {
            setError("Erro ao atualizar o perfil. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white flex flex-col relative overflow-hidden">
            {/* Background elements to match auth style */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/40 blur-[120px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center">
                    <Link href="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                        Conext <span className="text-gradient">Bot</span>
                    </Link>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10 animate-fade-in">
                        <h1 className="text-3xl font-bold mb-2">Quase lá!</h1>
                        <p className="text-gray-400">Só precisamos do seu documento principal para concluir o pagamento.</p>
                    </div>

                    <div className="glass p-8 rounded-3xl border-white/5 shadow-2xl animate-fade-in animation-delay-100">
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-4 text-yellow-500">
                            <AlertCircle className="shrink-0 w-6 h-6 mt-0.5 animate-pulse" />
                            <div className="text-sm">
                                <p className="font-bold mb-1 text-base">CPF/CNPJ Obrigatório</p>
                                <p className="text-yellow-500/80 leading-relaxed">
                                    O processador de pagamentos exige um CPF ou CNPJ válido para gerar a sua fatura com segurança.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Informe seu CPF ou CNPJ
                                </label>
                                <input
                                    type="text"
                                    name="cpfCnpj"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono"
                                    placeholder="Ex: 000.000.000-00"
                                    value={cpfCnpj}
                                    onChange={e => setCpfCnpj(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base rounded-xl font-medium"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Continuar para o Pagamento
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        }>
            <CompleteProfileContent />
        </Suspense>
    );
}
