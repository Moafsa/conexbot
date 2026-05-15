import { NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
        }

        const uploadPromises = files.map(async (file) => {
            const buffer = Buffer.from(await file.arrayBuffer());
            const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            const filename = `marketing/${session.user.id}/${Date.now()}-${sanitizedName}`;
            const url = await StorageService.uploadFile(buffer, filename, file.type);
            return url;
        });

        const urls = await Promise.all(uploadPromises);

        return NextResponse.json({ urls });
    } catch (error: any) {
        console.error("[MarketingUpload] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
