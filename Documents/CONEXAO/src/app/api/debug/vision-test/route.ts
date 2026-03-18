/**
 * Debug: test VisionService. POST with { image: "base64..." } or { url: "https://..." }
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const tmpPath = path.join(os.tmpdir(), `debug_vision_${Date.now()}.jpg`);
        let buffer: Buffer;

        if (body.url) {
            const res = await fetch(body.url);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            buffer = Buffer.from(await res.arrayBuffer());
        } else if (body.image) {
            const b64 = body.image.includes(',') ? body.image.split(',')[1] : body.image;
            buffer = Buffer.from(b64, 'base64');
        } else {
            return NextResponse.json({ error: 'Missing image (base64) or url' }, { status: 400 });
        }

        fs.writeFileSync(tmpPath, buffer);
        const hex = buffer.slice(0, 8).toString('hex');
        const { VisionService } = await import('@/services/engine/vision');
        const bot = { tenant: {} };
        const desc = await VisionService.analyze(tmpPath, undefined, bot);
        try { fs.unlinkSync(tmpPath); } catch {}
        return NextResponse.json({ ok: true, magicBytes: hex, size: buffer.length, description: desc.substring(0, 300) });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
