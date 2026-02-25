"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Visão Global", href: "/admin", icon: "🌎" },
        { name: "Clientes", href: "/admin/users", icon: "👥" },
        { name: "Receita", href: "/admin/finance", icon: "💰" },
        { name: "Logs do Sistema", href: "/admin/logs", icon: "📜" },
    ];

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 bg-red-900/10 backdrop-blur-xl border-r border-red-500/10 flex flex-col z-50">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight text-red-500">
                    Super Admin 🛡️
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? "bg-red-500/10 text-red-400 shadow-lg border border-red-500/5"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <span className="font-medium text-sm">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside >
    );
}
