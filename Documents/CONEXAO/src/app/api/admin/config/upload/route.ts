import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StorageService } from '@/lib/storage';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPERADMIN');
        
        if (!session || !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as 'colored' | 'white';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `system/logo-${type}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        
        const url = await StorageService.uploadFile(buffer, filename, file.type);

        // We don't update the DB here, we just return the URL so the frontend can preview and then "Save All"
        return NextResponse.json({ url });

    } catch (error) {
        console.error('[AdminUpload] Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
