"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, FileText } from "lucide-react";

export default function Navbar({ branding }: { branding?: any }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Link para suporte caso não haja demo
    const demoLink = branding?.supportWhatsapp 
        ? `https://wa.me/${branding.supportWhatsapp.replace(/\D/g, '')}`
        : "#";

    return (
        <header className={`fixed w-full z-[100] transition-all duration-500 ${scrolled ? 'py-4 bg-black/40 backdrop-blur-md border-b border-white/5' : 'py-8 bg-transparent'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                {/* Logo Dinâmica ou SVG Fallback */}
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="relative">
                        {branding?.logoWhiteUrl ? (
                            <img 
                                src={branding.logoWhiteUrl} 
                                alt={branding.systemName || "Logo"} 
                                className="h-10 w-auto group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <svg className="h-10 w-auto text-indigo-500 group-hover:scale-110 transition-transform duration-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 70L50 10L80 70L50 90L20 70Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" opacity="0.2"/>
                                <path d="M30 75L15 60L55 20L75 40L60 55L45 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="75" cy="40" r="4" fill="currentColor"/>
                                <circle cx="15" cy="60" r="4" fill="currentColor"/>
                                <path d="M85 15L75 25M85 25L75 15" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                            </svg>
                        )}
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700"></div>
                    </div>
                    <span className="text-2xl font-black italic tracking-tighter text-white">
                        {branding?.systemName || "Conext"}
                    </span>
                </Link>

                {/* Nav Links */}
                <nav className="hidden lg:flex items-center space-x-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <Link href="#agencias" className="hover:text-white transition-colors">Agências</Link>
                    <Link href="#features" className="hover:text-white transition-colors">Serviços</Link>
                    <Link href="/writer-plugin" className="hover:text-white transition-colors">Plugins</Link>
                    <Link href="#integracoes" className="hover:text-white transition-colors">Integrações</Link>
                    <Link href="/docs" className="flex items-center gap-2 hover:text-white transition-colors">
                        <FileText size={14} /> Documentação
                    </Link>
                </nav>

                {/* Right Side */}
                <div className="flex items-center space-x-4">
                    <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest px-4 py-2">
                        Entrar
                    </Link>
                    <Link href="/auth/register?isAgency=true" className="bg-indigo-600 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                        Começar Grátis
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button className="lg:hidden text-white ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-2xl border-b border-white/5 p-8 animate-in fade-in slide-in-from-top-4">
                    <nav className="flex flex-col space-y-6 text-xs font-black uppercase tracking-widest text-gray-400">
                        <Link href="#agencias" onClick={() => setIsMenuOpen(false)}>Agências</Link>
                        <Link href="#features" onClick={() => setIsMenuOpen(false)}>Serviços</Link>
                        <Link href="/writer-plugin" onClick={() => setIsMenuOpen(false)}>Plugins</Link>
                        <Link href="#integracoes" onClick={() => setIsMenuOpen(false)}>Integrações</Link>
                        <Link href="/docs" onClick={() => setIsMenuOpen(false)}>Documentação</Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
