"use server";

import { StorageService } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function uploadMarketingMedia(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Não autorizado");

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
        throw new Error("Nenhum arquivo enviado");
    }

    const uploadPromises = files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const filename = `marketing/${session.user.id}/${Date.now()}-${sanitizedName}`;
        const url = await StorageService.uploadFile(buffer, filename, file.type);
        return url;
    });

    const urls = await Promise.all(uploadPromises);
    return { urls };
}
