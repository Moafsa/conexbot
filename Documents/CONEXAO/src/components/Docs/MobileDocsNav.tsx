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
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-white transition-colors relative z-[100]"
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Menu Dropdown - SOLID NUCLEAR VERSION */}
            {isOpen && (
                <div className="fixed inset-0 z-[99999] bg-black/90 md:hidden" onClick={() => setIsOpen(false)}>
                    {/* Drawer Content */}
                    <div 
                        className="absolute top-20 left-0 right-0 bottom-0 bg-[#030014] p-6 flex flex-col gap-8 shadow-2xl overflow-y-auto border-t border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest italic">DOCUMENTAÇÃO</span>
                        </div>

                        <nav className="space-y-10 pb-20">
                            {sections.map((section, idx) => (
                                <div key={idx}>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
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
                                                    className="flex items-center gap-4 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 px-4 py-4 rounded-2xl transition-all border border-white/5 bg-white/[0.02]"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                                        <Icon size={20} className="text-indigo-400" />
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

                        <div className="mt-auto py-6 border-t border-white/5 bg-[#030014] sticky bottom-0 z-10">
                            <Link 
                                href="/dashboard" 
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-black text-white transition-all uppercase tracking-widest shadow-2xl shadow-indigo-500/40"
                            >
                                Voltar para o App
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
