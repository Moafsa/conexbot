import Shell from "@/components/Dashboard/Shell";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Shell>{children}</Shell>;
}
