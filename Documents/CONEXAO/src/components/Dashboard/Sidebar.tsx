
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { CreditCard, Settings, ChevronLeft, ChevronRight, LogOut, Users, LayoutDashboard, MessageSquare, Shield } from "lucide-react";

export default function Sidebar({ branding }: { branding?: any }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(true);

    const logo = branding?.logoWhiteUrl || branding?.logoColoredUrl || "/logo.png";
    const systemName = branding?.systemName || "Conext Bot";
    const firstName = systemName.split(' ')[0];
    const lastName = systemName.split(' ').slice(1).join(' ');

    const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'SUPERADMIN';

    const menuItems = [
        { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard" },
        { icon: Users, label: "CRM Pipeline", href: "/dashboard/crm" },
        { icon: MessageSquare, label: "Meus Bots", href: "/dashboard/bots" },
        { icon: CreditCard, label: "Financeiro", href: "/dashboard/finance" },
        { icon: Settings, label: "Configurações", href: "/dashboard/settings" },
    ];

    if (isAdmin) {
        menuItems.push({ icon: Shield, label: "Administração", href: "/admin" });
    }

    return (
        <aside className={`h-full bg-[#0f172a] border-r border-white/10 transition-all duration-300 flex flex-col shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
            {/* Brand */}
            <div className="h-24 flex items-center justify-center border-b border-white/5 relative px-4 text-center">
                {!collapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img src={logo} className="h-12 w-auto shrink-0 object-contain" alt="Logo" />
                        <h1 className="font-bold text-xl tracking-tighter text-white truncate">
                            {firstName}<span className="text-[#00a884]">{lastName}</span>
                        </h1>
                    </div>
                )}
                {collapsed && <img src={logo} className="h-12 w-auto object-contain" alt="Logo" />}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 bg-[#00a884] rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#008f6f] transition-colors text-white shadow-lg border border-[#0f172a]"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 py-6 px-3 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? "bg-[#00a884]/10 border border-[#00a884]/20 text-[#00a884]"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                                <item.icon size={22} />
                            </span>
                            <span className={`font-medium whitespace-nowrap overflow-hidden transition-all ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                {item.label}
                            </span>
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a884] shadow-[0_0_5px_#00a884]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer */}
            <div className="p-4 border-t border-white/5 space-y-2 bg-[#0f172a]">
                <button className={`w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00a884] to-emerald-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        U
                    </div>
                    {!collapsed && (
                        <div className="text-left flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">Minha Conta</p>
                            <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${collapsed ? 'justify-center' : ''}`}
                    title="Sair da Conta"
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="font-medium">Sair</span>}
                </button>
            </div>
        </aside>
    );
}
