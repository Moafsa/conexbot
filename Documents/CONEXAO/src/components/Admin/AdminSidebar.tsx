"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
    LayoutDashboard, 
    Users, 
    Package, 
    CreditCard, 
    UserCircle, 
    Settings, 
    ChevronLeft, 
    ChevronRight,
    LogOut,
    Shield
} from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);

    const links = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Usuários", href: "/admin/users", icon: Users },
        { name: "Planos", href: "/admin/plans", icon: Package },
        { name: "Pagamentos", href: "/admin/payments", icon: CreditCard },
        { name: "Meu Perfil", href: "/admin/profile", icon: UserCircle },
        { name: "Configurações", href: "/admin/settings", icon: Settings },
    ];

    return (
        <aside className={`h-screen bg-[#0a0a0a] border-r border-[#1a1a1a] transition-all duration-300 flex flex-col shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
            {/* Brand/Header */}
            <div className="h-28 flex items-center justify-center border-b border-white/5 relative px-4 text-center">
                {!collapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-amber-500 shrink-0" />
                        <h1 className="font-bold text-xl tracking-tighter text-white truncate">
                            SUPER<span className="text-red-500">ADMIN</span>
                        </h1>
                    </div>
                )}
                {collapsed && (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-10 bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors text-white shadow-lg border border-[#0a0a0a]"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? "bg-red-500/10 border border-red-500/20 text-red-500"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <span className={`transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                                <link.icon size={22} />
                            </span>
                            <span className={`font-medium whitespace-nowrap overflow-hidden transition-all ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                {link.name}
                            </span>
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/5 space-y-2">
                <Link
                    href="/dashboard"
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
                    title="Voltar ao App"
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="font-medium">Voltar ao App</span>}
                </Link>
            </div>
        </aside>
    );
}
