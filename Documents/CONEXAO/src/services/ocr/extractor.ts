import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// Polyfills for pdfjs-dist
if (!global.DOMMatrix) {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { };
    // @ts-ignore
    global.ImageData = class ImageData { };
    // @ts-ignore
    global.Path2D = class Path2D { };
    // @ts-ignore
    if (!global.ReadableStream) {
        try {
            // @ts-ignore
            global.ReadableStream = require('stream/web').ReadableStream;
        } catch (e) { }
    }
}

// @ts-ignore
export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; success: boolean; error?: string }> {
    try {
        // Use dynamic import for ESM build (pdf.mjs)
        // @ts-ignore
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Define absolute path to the worker
        // We know from list_dir that pdf.worker.mjs exists in legacy/build
        const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');

        // @ts-ignore
        if (pdfjs.GlobalWorkerOptions) {
            // Check if file exists to be safe
            if (fs.existsSync(workerPath)) {
                // On Windows/ESM, we need a file:// URL, not a path
                // @ts-ignore
                pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();
            } else {
                // Fallback: Disable worker if path is wrong (might be slower/buggy but better than crash)
                // Or try CDN as last resort (not recommended for local dev but works)
                // @ts-ignore
                pdfjs.GlobalWorkerOptions.workerSrc = '';
            }
        }

        const data = new Uint8Array(buffer);
        const loadingTask = pdfjs.getDocument({
            data,
            useSystemFonts: true,
            disableFontFace: true,
            verbosity: 0, // Suppress warnings
            isEvalSupported: false
        });

        const doc = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            // @ts-ignore
            const strings = content.items.map((item: any) => item.str);
            fullText += strings.join(' ') + '\n';
        }

        console.log('[OCR] Extracted text length:', fullText.trim().length);
        if (fullText.trim().length < 50) {
            console.log('[OCR] Text preview:', fullText.substring(0, 100));
        }

        return {
            success: true,
            text: fullText.trim(),
        };
    } catch (error) {
        console.error('[OCR] PDF extraction error:', error);
        return {
            success: false,
            text: '',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Extract text from images using Tesseract OCR
 */
export async function extractTextFromImage(buffer: Buffer): Promise<{ text: string; success: boolean; error?: string }> {
    let worker;
    try {
        console.log('[OCR] Creating Tesseract worker...');
        worker = await createWorker('por'); // Portuguese language

        console.log('[OCR] Starting image recognition...');
        const { data } = await worker.recognize(buffer);
        await worker.terminate();

        return {
            success: true,
            text: data.text.trim(),
        };
    } catch (error) {
        console.error('[OCR] Image extraction error:', error);
        if (worker) {
            try {
                await (worker as any).terminate();
            } catch (e) { }
        }

        return {
            success: false,
            text: '',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Extract text from file based on type
 */
export async function extractText(
    url: string,
    type: 'pdf' | 'image'
): Promise<{ text: string; success: boolean; error?: string }> {
    try {
        // Fetch file from URL
        const response = await fetch(url);
        if (!response.ok) {
            return {
                success: false,
                text: '',
                error: 'Failed to fetch file from URL',
            };
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (type === 'pdf') {
            return await extractTextFromPDF(buffer);
        } else {
            return await extractTextFromImage(buffer);
        }
    } catch (error) {
        console.error('[OCR] Extract text error:', error);
        return {
            success: false,
            text: '',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
