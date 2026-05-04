import { NextResponse } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReportingService } from "@/services/marketing/reporting-service";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const report = await ReportingService.generateSummary(session.user.id);
        return NextResponse.json(report);
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
    }
}
