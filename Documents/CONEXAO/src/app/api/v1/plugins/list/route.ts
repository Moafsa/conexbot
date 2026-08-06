import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CONEXT_PLUGIN_LIST } from '@/lib/conext-plugins';

export const dynamic = 'force-dynamic';

function readLiveVersion(folder: string, file: string): string | null {
    const pluginPath = path.join(process.cwd(), folder, file);
    if (!fs.existsSync(pluginPath)) return null;
    const content = fs.readFileSync(pluginPath, 'utf8');
    // Some plugin headers use a docblock with a leading "*" per line, others (ex: conext-writer.php)
    // use a plain /* ... */ block with no per-line prefix — don't require the asterisk.
    const match = content.match(/Version:\s*([0-9.]+)/i);
    return match?.[1] || null;
}

export async function GET() {
    const plugins = CONEXT_PLUGIN_LIST.map((p) => ({
        ...p,
        version: readLiveVersion(p.folder, p.file),
        downloadUrl: `/${p.zip}`,
    }));

    return NextResponse.json({ plugins });
}
