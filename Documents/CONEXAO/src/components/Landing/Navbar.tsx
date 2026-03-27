"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export default function Navbar({ branding }: { branding?: any }) {
    const { data: session } = useSession();
    const systemName = branding?.systemName || "Conext Bot";
    const [firstName, ...rest] = systemName.split(' ');
    const lastName = rest.join(' ');

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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-cyan-500/20">
                            <span className="text-black font-black text-xl italic">C</span>
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white italic">
                            {firstName}<span className="text-cyan-500">{lastName}</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-10">
                        {[
                            { label: 'Poderes', href: '#features' },
                            { label: 'Planos', href: '#pricing' },
                            { label: 'Documentação', href: '/docs' }
                        ].map((link) => (
                            <Link 
                                key={link.label} 
                                href={link.href}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-cyan-400 transition-colors italic"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        {session ? (
                            <Link href="/dashboard" className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-cyan-400 transition-all italic shadow-xl shadow-white/10">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/auth/login" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-cyan-400 transition-colors italic">
                                    Entrar
                                </Link>
                                <Link 
                                    href="/auth/register" 
                                    className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-cyan-400 hover:text-black transition-all shadow-xl shadow-white/10 italic"
                                >
                                    Começar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
