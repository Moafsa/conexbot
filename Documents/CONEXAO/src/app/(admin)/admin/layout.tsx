import AdminSidebar from '@/components/Admin/AdminSidebar';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions) as any;
    const role = session?.user?.role;

    if (!session?.user || (role !== "ADMIN" && role !== "SUPERADMIN")) {
        redirect("/dashboard");
    }
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
