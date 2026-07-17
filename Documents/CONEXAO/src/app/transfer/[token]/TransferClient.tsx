"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRightLeft, AlertCircle, Loader2 } from "lucide-react";

export default function TransferClient({ token, payload }: { token: string, payload: any }) {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleConfirm = async () => {
        setStatus("loading");
        try {
            const res = await fetch(`/api/transfer/${token}/confirm`, {
                method: "POST"
            });
            const data = await res.json();
            
            if (res.ok) {
                setStatus("success");
            } else {
                setStatus("error");
                setErrorMsg(data.error || "Erro ao confirmar transferência");
            }
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Erro de conexão");
        }
    };

    if (status === "success") {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white font-sans">
                <div className="bg-[#111827] border border-emerald-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="text-emerald-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Transferência Concluída!</h2>
                    <p className="text-gray-400 mb-8">
                        Sua conta foi transferida com sucesso para a agência <strong className="text-white">{payload.newAgencyName}</strong>. 
                        A partir de agora eles irão gerenciar suas configurações.
                    </p>
                    <a 
                        href="/auth/login"
                        className="inline-block w-full py-4 rounded-2xl bg-[#1a2235] hover:bg-[#243049] font-bold transition-all border border-white/10"
                    >
                        Voltar para o Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white font-sans">
            <div className="bg-[#111827] border border-white/10 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ArrowRightLeft className="text-indigo-400" size={40} />
                </div>
                
                <h2 className="text-2xl font-bold mb-4">Aprovar Transferência</h2>
                
                <p className="text-gray-400 mb-8 leading-relaxed">
                    A agência <strong className="text-white text-lg">{payload.newAgencyName}</strong> solicitou a transferência da sua conta para a gestão deles.
                </p>

                <div className="bg-[#0b0f1a] rounded-2xl p-5 text-sm text-left mb-8 border border-white/5">
                    <p className="text-gray-500 mb-2 font-bold uppercase tracking-widest text-[10px]">O que muda?</p>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" /> A nova agência poderá gerenciar seu bot e fluxos de atendimento.</li>
                        <li className="flex gap-2"><CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" /> Todo o seu histórico, leads e conversas serão mantidos intactos.</li>
                    </ul>
                </div>

                {status === "error" && (
                    <div className="mb-6 flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-sm text-red-400 text-left">
                        <AlertCircle size={16} className="shrink-0" />
                        {errorMsg}
                    </div>
                )}

                <button
                    onClick={handleConfirm}
                    disabled={status === "loading"}
                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {status === "loading" ? <Loader2 size={20} className="animate-spin" /> : "Aprovar Transferência Agora"}
                </button>
            </div>
        </div>
    );
}
