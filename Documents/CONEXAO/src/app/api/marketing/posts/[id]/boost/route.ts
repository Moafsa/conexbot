import { NextResponse } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MetaPostService } from "@/services/marketing/meta-post-service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const adId = await MetaPostService.boostPost({
            postId: params.id,
            dailyBudget: body.dailyBudget || 1000, // R$ 10 padrão
            adSetId: body.adSetId
        });
        return NextResponse.json({ success: true, adId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
