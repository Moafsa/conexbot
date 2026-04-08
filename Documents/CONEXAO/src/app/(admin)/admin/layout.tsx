export const dynamic = 'force-dynamic';
import React from 'react';
import AdminSidebar from '@/components/Admin/AdminSidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#050505] text-white font-inter">
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
