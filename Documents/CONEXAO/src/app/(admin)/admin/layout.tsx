import React from 'react';
import Link from 'next/link';
import {
    Users,
    LayoutDashboard,
    CreditCard,
    Settings,
    Package,
    LogOut,
    UserCircle
} from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#050505] text-white font-inter">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#1a1a1a] bg-[#0a0a0a] flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        CONEXAO ADMIN
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavLink href="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavLink href="/admin/users" icon={<Users size={20} />} label="Usuários" />
                    <NavLink href="/admin/plans" icon={<Package size={20} />} label="Planos" />
                    <NavLink href="/admin/payments" icon={<CreditCard size={20} />} label="Pagamentos" />
                    <NavLink href="/admin/profile" icon={<UserCircle size={20} />} label="Meu Perfil" />
                    <NavLink href="/admin/settings" icon={<Settings size={20} />} label="Configurações" />
                </nav>

                <div className="p-4 border-t border-[#1a1a1a]">
                    <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#151515] rounded-xl transition-all duration-300"
                    >
                        <LogOut size={20} />
                        <span>Voltar ao App</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#151515] rounded-xl transition-all duration-300 group"
        >
            <span className="text-gray-500 group-hover:text-blue-400 transition-colors">
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}
