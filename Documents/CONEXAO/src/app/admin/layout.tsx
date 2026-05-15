import AdminSidebar from "@/components/Admin/AdminSidebar";
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
