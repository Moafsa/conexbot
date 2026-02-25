import { NextResponse } from 'next/server';
import { scrapeWebsite } from '@/services/engine/scraper';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    console.log(`[DebugScraper] Scraping ${url}...`);
    try {
        const result = await scrapeWebsite(url);

        // Save to file for debug
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'debug_scraper_output.html');
        fs.writeFileSync(filePath, result.content || result.error || 'Empty');

        return NextResponse.json({
            url,
            success: result.success,
            title: result.title,
            contentLength: result.content.length,
            preview: result.content.substring(0, 500),
            savedToFile: filePath,
            error: result.error
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
