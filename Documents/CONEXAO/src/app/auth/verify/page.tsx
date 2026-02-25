"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyContent() {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const contact = searchParams.get("contact");
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate Verification
        setTimeout(() => {
            setLoading(false);
            // Navigate to Dashboard
            router.push("/dashboard");
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-2">Verificar Acesso</h2>
                <p className="text-gray-400 mb-8">
                    Enviamos um código de 6 dígitos para <br />
                    <span className="text-white font-medium">{contact}</span>
                </p>

                <div className="glass p-8 rounded-2xl border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { inputs.current[i] = el; }}
                                    type="text"
                                    maxLength={1}
                                    className="w-12 h-14 bg-black/40 border border-white/10 rounded-lg text-center text-2xl font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    value={digit}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.some(c => !c)}
                            className="btn-primary w-full flex items-center justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Validar Código"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex justify-between text-sm">
                        <button className="text-gray-500 hover:text-white transition-colors">
                            Reenviar Código
                        </button>
                        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
                            Alterar contato
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
