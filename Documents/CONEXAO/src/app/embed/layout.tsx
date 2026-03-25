"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Users, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { label: "CRM Pipeline", href: "/embed/crm", icon: Users },
        { label: "Meus Agentes", href: "/embed/bots", icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col w-full">
            {/* Minimalist Top Nav for Embed */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600"
                                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                }`}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 base rounded-lg transition-all"
                    title="Sair da Conta"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Sair</span>
                </button>
            </div>

            <div className="flex-1 p-4 overflow-auto">
                {children}
            </div>

            <div className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
                Powered by <a href="https://conext.click" target="_blank" className="hover:text-indigo-500 transition-colors font-medium">Conext.click</a>
            </div>
        </div>
    );
}
