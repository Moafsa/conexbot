"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export default function Navbar({ branding }: { branding?: any }) {
    const { data: session } = useSession();
    const systemName = branding?.systemName || "Conext Bot";
    const logo = branding?.logo || "/logo.svg";

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-8'}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className={`glass rounded-[2rem] px-8 py-4 flex items-center justify-between border border-white/5 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl shadow-2xl shadow-cyan-500/10' : 'bg-transparent'}`}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src={logo} alt={systemName} className="h-14 w-auto object-contain group-hover:scale-105 transition-all duration-300" />
                        <span className="text-2xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
                            {systemName}
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-10">
                        {[
                            { label: 'Funcionalidades', href: '#features' },
                            { label: 'Planos', href: '#pricing' },
                            { label: 'Documentação', href: '/docs' }
                        ].map((link) => (
                            <Link 
                                key={link.label} 
                                href={link.href}
                                className="text-sm font-medium text-gray-400 hover:text-indigo-400 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        {session ? (
                            <Link href="/dashboard" className="px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-indigo-400 transition-colors">
                                    Entrar
                                </Link>
                                <Link 
                                    href="/auth/register" 
                                    className="px-8 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                                >
                                    Começar Agora
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
