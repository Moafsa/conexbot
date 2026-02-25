import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <main className="flex-1 p-8 relative overflow-hidden h-screen overflow-y-auto">
                {/* Background Orbs for Dashboard internal feel */}
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                {children}
            </main>
        </div>
    );
}
