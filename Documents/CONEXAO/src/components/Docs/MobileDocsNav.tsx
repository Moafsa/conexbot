"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { docsNavIconMap, type DocsNavIconKey } from "@/components/Docs/docs-nav-data";

interface MobileDocsNavProps {
    sections: {
        title: string;
        items: {
            title: string;
            href: string;
            iconKey: DocsNavIconKey;
        }[];
    }[];
}

export function MobileDocsNav({ sections }: MobileDocsNavProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden">
            {/* Hamburger Button - Matches Home Style */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Dropdown - Matches Home Logic */}
            {isOpen && (
                <div className="fixed top-20 left-4 right-4 z-[9999] p-6 glass rounded-2xl border border-white/10 bg-[#02000a] flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-4 duration-300 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-2 shrink-0">
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest italic">Navegação Docs</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Conext Bot</span>
                    </div>

                    <nav className="space-y-8">
                        {sections.map((section, idx) => (
                            <div key={idx}>
                                <h4 className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-[0.2em] mb-4">
                                    {section.title}
                                </h4>
                                <ul className="grid grid-cols-1 gap-2">
                                    {section.items.map((item, i) => {
                                        const Icon = docsNavIconMap[item.iconKey];
                                        return (
                                        <li key={i}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 text-sm font-medium text-gray-300 hover:text-indigo-400 hover:bg-white/5 px-3 py-3 rounded-xl transition-all border border-transparent hover:border-white/5"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                                    <Icon size={18} className="text-gray-400" />
                                                </div>
                                                {item.title}
                                            </Link>
                                        </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>

                    <div className="pt-4 border-t border-white/5 mt-2">
                        <Link 
                            href="/dashboard" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                        >
                            Voltar para o App
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
