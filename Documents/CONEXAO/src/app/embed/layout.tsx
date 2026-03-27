"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, Users, MessageSquare, Settings, Loader2, LayoutDashboard, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            router.push("/wp-onboarding");
            return;
        }

        const checkStatus = async () => {
            try {
                const res = await fetch("/api/v1/wp/me", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) {
                    router.push("/wp-onboarding");
                    return;
                }
                const data = await res.json();
                setStatus(data);
                
                // Absolute gate: if no plan, don't allow dashboard access
                if (!data.hasPlan) {
                    router.push(`/wp-onboarding?token=${token}&step=plan`);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [token, router]);

    const navItems = [
        { label: "Métricas", href: "/embed/dashboard", icon: LayoutDashboard },
        { label: "Meus Agentes", href: "/embed/bots", icon: MessageSquare },
        { label: "CRM Pipeline", href: "/embed/crm", icon: Users },
        { label: "Financeiro", href: "/embed/finance", icon: CreditCard },
        { label: "Configurações", href: "/embed/settings", icon: Settings },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
                <p className="text-gray-400 font-medium">Validando sua conexão segura...</p>
            </div>
        );
    }

    if (!status?.hasPlan) {
        return null; // Redirecting in useEffect
    }

    return (
        <div className="flex flex-col h-screen bg-[#070708] text-white overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0a0a0c] border-b border-white/5 shrink-0 shadow-2xl z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="https://bs3.conext.click/media/system/logo-white-1773758797708-logo-white.png" alt="ConextBot" className="h-7 w-auto" />
                    </div>
                    
                    <nav className="hidden sm:flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={`${item.href}?token=${token}`}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                                        ${active 
                                            ? 'bg-white/10 text-white shadow-inner shadow-white/5 border border-white/5' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <item.icon size={16} className={active ? "text-purple-400" : ""} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-4">
                        <span className="text-xs font-bold text-white leading-none">{status.name}</span>
                        <span className="text-[10px] text-purple-400 uppercase tracking-widest mt-1 font-black flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                            CLIENTE PRO
                        </span>
                    </div>
                    
                    <button
                        onClick={() => {
                            // On logout, we return to instructions. The actual token clearing is done in WP if necessary,
                            // but here we just exit the dashboard view.
                            window.location.href = "/wp-onboarding";
                        }}
                        className="p-2.5 text-gray-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-xl transition-all group"
                        title="Desconectar"
                    >
                        <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 overflow-auto p-2 sm:p-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(88,28,135,0.05),transparent)]">
                <div className="max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </main>

            {/* Compact Footer Branding */}
            <footer className="px-6 py-3 bg-[#0a0a0c] border-t border-white/5 flex items-center justify-between shrink-0">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest flex items-center gap-1.5">
                    Powered by <span className="text-gray-300 font-black">Conext.click</span>
                </p>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sistema Online</span>
                </div>
            </footer>
        </div>
    );
}
