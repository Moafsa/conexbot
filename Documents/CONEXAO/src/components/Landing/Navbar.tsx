
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bot, User } from "lucide-react";

export default function Navbar({ branding }: { branding?: any }) {
    const { data: session } = useSession();

    const logo = branding?.logoWhiteUrl || branding?.logoColoredUrl || "/logo.png";
    const systemName = branding?.systemName || "Conext Bot";

    return (
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between glass border border-white/5 px-6 py-3 rounded-2xl shadow-2xl">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <img src={logo} alt={systemName} className="h-14 w-auto object-contain group-hover:scale-105 transition-all duration-300" />
                    <span className="text-2xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {systemName}
                    </span>
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-8 translate-x-4">
                    <Link href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Funcionalidades</Link>
                    <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Preços</Link>
                    <Link href="/docs" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Documentação</Link>
                </div>

                {/* Auth */}
                <div className="flex items-center gap-4">
                    {session ? (
                        <Link href="/dashboard" className="btn-primary flex items-center gap-2 px-6 py-2 text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                            Dashboard <User size={14} />
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth/login" className="text-sm font-bold text-gray-400 hover:text-white transition-all px-4 py-2 border border-transparent hover:border-white/10 rounded-xl">
                                Entrar
                            </Link>
                            <Link href="/auth/register" className="btn-primary px-6 py-2 text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                                Iniciar Grátis
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
