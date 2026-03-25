"use client";

import { useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function GooglePopupCallbackPage() {
    const { status } = useSession();

    useEffect(() => {
        if (status === "authenticated") {
            // Notify the opener (the WordPress iframe) that auth was successful
            if (window.opener) {
                window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, "*");
                setTimeout(() => window.close(), 1000);
            } else {
                // Fallback for direct access
                window.location.href = "/dashboard";
            }
        }
    }, [status]);

    return (
        <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center text-white p-6">
            <div className="flex flex-col items-center gap-6 text-center">
                {status === "loading" ? (
                    <>
                        <Loader2 className="animate-spin text-purple-500" size={40} />
                        <h1 className="text-xl font-bold">Finalizando login...</h1>
                    </>
                ) : status === "authenticated" ? (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="text-green-500" size={32} />
                        </div>
                        <h1 className="text-2xl font-black">Login Realizado!</h1>
                        <p className="text-gray-500 text-sm">Você já pode voltar para o WordPress. <br/>Esta janela fechará em breve.</p>
                    </>
                ) : (
                    <>
                         <h1 className="text-xl font-bold text-red-500">Erro na autenticação</h1>
                         <p className="text-gray-500 mb-4">Por favor, tente novamente.</p>
                         <button onClick={() => window.close()} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold">Fechar Janela</button>
                    </>
                )}
            </div>
        </div>
    );
}
