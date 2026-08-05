import { NextResponse } from "next/server";
import { AdSpendTrackerService } from "@/services/marketing/ad-spend-tracker";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        console.log("[AdsSnapshotCron] Iniciando captura de gastos diários...");
        const result = await AdSpendTrackerService.captureAllSnapshots();

        return NextResponse.json({
            success: true,
            message: "Snapshot de gastos capturado",
            ...result
        });
    } catch (error: any) {
        console.error("[AdsSnapshotCron] Erro fatal:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
