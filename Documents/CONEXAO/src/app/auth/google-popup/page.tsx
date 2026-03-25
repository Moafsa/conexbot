"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function GooglePopupPage() {
    useEffect(() => {
        // Automatically trigger Google sign in with a specific callback to this same group
        signIn("google", { callbackUrl: "/auth/google-popup/callback" });
    }, []);

    return (
        <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center text-white p-6">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-purple-500" size={40} />
                <h1 className="text-xl font-bold">Conectando ao Google...</h1>
                <p className="text-gray-500 text-sm">Esta janela fechará automaticamente após o login.</p>
            </div>
        </div>
    );
}
