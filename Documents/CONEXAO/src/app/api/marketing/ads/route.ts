import { NextResponse } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MetaAdsService } from "@/services/marketing/meta-ads-service";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const [campaigns, insights] = await Promise.all([
            MetaAdsService.listCampaigns(session.user.id),
            MetaAdsService.getInsights(session.user.id)
        ]);

        return NextResponse.json({ campaigns, insights });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao buscar dados de anúncios" }, { status: 500 });
    }
}
