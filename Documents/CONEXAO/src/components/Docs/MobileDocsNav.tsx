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
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 md:hidden text-gray-400 hover:text-white transition-colors"
                aria-label="Abrir menu"
            >
                <Menu size={24} />
            </button>

            {/* Slide-over Menu */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Content (Drawer) */}
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-neutral-950 border-l border-white/10 p-6 shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-10 shrink-0">
                            <span className="text-sm font-black text-indigo-400 font-mono uppercase tracking-widest italic">MENU DOCS</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
                            {sections.map((section, idx) => (
                                <div key={idx}>
                                    <h4 className="text-[10px] font-bold text-indigo-500/60 uppercase tracking-[0.2em] mb-4">
                                        {section.title}
                                    </h4>
                                    <ul className="space-y-2">
                                        {section.items.map((item, i) => {
                                            const Icon = docsNavIconMap[item.iconKey];
                                            return (
                                            <li key={i}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-indigo-400 hover:bg-white/5 px-2 py-2 rounded-lg transition-all group"
                                                >
                                                    <Icon size={18} className="text-gray-500 group-hover:text-indigo-400" />
                                                    {item.title}
                                                </Link>
                                            </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                        
                        <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
                            <Link 
                                href="/dashboard" 
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest"
                            >
                                Voltar para o App
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
