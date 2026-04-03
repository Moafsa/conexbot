"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileDocsNavProps {
    sections: {
        title: string;
        items: {
            title: string;
            href: string;
            icon: any;
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
                <div className="fixed inset-0 z-[60] md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Content */}
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#030014] border-l border-white/5 p-6 shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-sm font-black text-indigo-400 uppercase tracking-widest italic">Documentação</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="space-y-8 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
                            {sections.map((section, idx) => (
                                <div key={idx}>
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                                        {section.title}
                                    </h4>
                                    <ul className="space-y-2">
                                        {section.items.map((item, i) => (
                                            <li key={i}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-indigo-400 hover:bg-white/5 px-2 py-2 rounded-lg transition-all group"
                                                >
                                                    <item.icon size={18} className="text-gray-500 group-hover:text-indigo-400" />
                                                    {item.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
