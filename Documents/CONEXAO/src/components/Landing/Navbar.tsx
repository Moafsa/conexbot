"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { User, Menu, X } from "lucide-react";

export default function Navbar({ branding }: { branding?: any }) {
    const { data: session } = useSession();
    const systemName = branding?.systemName || "Conext Bot";
    const logo = branding?.logoWhiteUrl || branding?.logoColoredUrl || "/logo.png";

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-2 md:py-4' : 'py-4 md:py-8'}`}>
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className={`glass rounded-2xl md:rounded-[2rem] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border border-white/5 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl shadow-2xl shadow-cyan-500/10' : 'bg-transparent'}`}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 md:gap-3 group">
                        <img src={logo} alt={systemName} className="h-10 md:h-14 w-auto object-contain group-hover:scale-105 transition-all duration-300" />
                        <span className="text-xl md:text-2xl font-black text-white italic hidden sm:inline-block">
                            Conext <span className="text-gradient">Bot</span>
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
                    <div className="flex items-center gap-3 md:gap-6">
                        {session ? (
                            <Link href="/dashboard" className="px-4 md:px-8 py-2 md:py-3 bg-indigo-600 text-white text-xs md:text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-indigo-400 transition-colors">
                                    Entrar
                                </Link>
                                <Link 
                                    href="/auth/register" 
                                    className="px-4 md:px-8 py-2 md:py-3 bg-indigo-600 text-white text-[10px] md:text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap"
                                >
                                    Começar Agora
                                </Link>
                            </>
                        )}
                        {/* Mobile Hamburger Toggle */}
                        <button 
                            className="md:hidden p-1 text-gray-400 hover:text-white transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-2 p-4 glass rounded-2xl border border-white/5 bg-black/90 backdrop-blur-2xl flex flex-col gap-4 animate-in slide-in-from-top-4">
                        {[
                            { label: 'Funcionalidades', href: '#features' },
                            { label: 'Planos', href: '#pricing' },
                            { label: 'Documentação', href: '/docs' }
                        ].map((link) => (
                            <Link 
                                key={link.label} 
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-sm font-medium text-gray-300 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                            >
                                {link.label}
                            </Link>
                        ))}
                        {!session && (
                            <Link 
                                href="/auth/login" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="sm:hidden text-sm font-medium text-gray-300 hover:text-indigo-400 p-2"
                            >
                                Entrar
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
