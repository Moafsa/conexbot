import AdminSidebar from "@/components/Admin/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white flex">
            <AdminSidebar />
            <main className="flex-1 ml-64 p-8 relative overflow-hidden">
                {/* Admin Background */}
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
                {children}
            </main>
        </div>
    );
}
