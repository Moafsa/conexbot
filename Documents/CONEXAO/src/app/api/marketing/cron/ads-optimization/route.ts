import { NextResponse } from "next/server";
import { AdsSupervisorService } from "@/services/marketing/ads-supervisor";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Verificar Header de autorização (Se configurado no Vercel Cron)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new Response('Unauthorized', { status: 401 });
        // }

        console.log("[AdsCron] Iniciando processamento...");
        const result = await AdsSupervisorService.runOptimization();
        
        return NextResponse.json({ 
            success: true, 
            message: "Otimização concluída",
            processed: result.processed 
        });
    } catch (error: any) {
        console.error("[AdsCron] Erro fatal:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
