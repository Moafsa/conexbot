import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// ── pdfjs polyfills ───────────────────────────────────────────────────────────
if (!global.DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix { };
    (global as any).ImageData = class ImageData { };
    (global as any).Path2D = class Path2D { };
    if (!(global as any).ReadableStream) {
        try { (global as any).ReadableStream = require('stream/web').ReadableStream; } catch {}
    }
}

export type ExtractResult = { text: string; success: boolean; error?: string };

// ── PDF ───────────────────────────────────────────────────────────────────────
export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractResult> {
    try {
        // @ts-ignore — pdfjs-dist legacy has no TS declarations
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs') as any;
        const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        if (pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = fs.existsSync(workerPath)
                ? pathToFileURL(workerPath).toString()
                : '';
        }
        const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, disableFontFace: true, verbosity: 0, isEvalSupported: false }).promise;
        let fullText = '';
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return { success: true, text: fullText.trim() };
    } catch (error: any) {
        console.error('[OCR] PDF error:', error.message);
        return { success: false, text: '', error: error.message };
    }
}

// ── Image (Tesseract OCR) ─────────────────────────────────────────────────────
export async function extractTextFromImage(buffer: Buffer): Promise<ExtractResult> {
    let worker: any;
    try {
        worker = await createWorker('por');
        const { data } = await worker.recognize(buffer);
        await worker.terminate();
        return { success: true, text: data.text.trim() };
    } catch (error: any) {
        try { await worker?.terminate(); } catch {}
        return { success: false, text: '', error: error.message };
    }
}

// ── DOCX (mammoth) ────────────────────────────────────────────────────────────
export async function extractTextFromDocx(buffer: Buffer): Promise<ExtractResult> {
    try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return { success: true, text: result.value.trim() };
    } catch (error: any) {
        console.error('[OCR] DOCX error:', error.message);
        return { success: false, text: '', error: error.message };
    }
}

// ── XLSX / XLS ────────────────────────────────────────────────────────────────
export async function extractTextFromXlsx(buffer: Buffer): Promise<ExtractResult> {
    try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const lines: string[] = [];
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
            lines.push(`[Planilha: ${sheetName}]\n${csv}`);
        }
        return { success: true, text: lines.join('\n\n').trim() };
    } catch (error: any) {
        console.error('[OCR] XLSX error:', error.message);
        return { success: false, text: '', error: error.message };
    }
}

// ── CSV ───────────────────────────────────────────────────────────────────────
export async function extractTextFromCsv(buffer: Buffer): Promise<ExtractResult> {
    try {
        const text = buffer.toString('utf-8');
        // Convert CSV to readable table-like text, limit to 500 rows to avoid token overflow
        const rows = text.split('\n').slice(0, 500);
        return { success: true, text: rows.join('\n').trim() };
    } catch (error: any) {
        return { success: false, text: '', error: error.message };
    }
}

// ── Plain text / Markdown / JSON ──────────────────────────────────────────────
export async function extractTextFromPlain(buffer: Buffer): Promise<ExtractResult> {
    try {
        const text = buffer.toString('utf-8');
        return { success: true, text: text.trim() };
    } catch (error: any) {
        return { success: false, text: '', error: error.message };
    }
}

// ── Router: extract by MIME type ──────────────────────────────────────────────
export type SupportedMime =
    | 'application/pdf'
    | 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'image/bmp' | 'image/tiff'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    | 'application/msword'  // .doc (fallback to mammoth if possible)
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    | 'application/vnd.ms-excel' // .xls
    | 'text/csv'
    | 'text/plain'
    | 'text/markdown'
    | 'application/json';

export function detectMimeFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
        pdf:  'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc:  'application/msword',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls:  'application/vnd.ms-excel',
        csv:  'text/csv',
        txt:  'text/plain',
        md:   'text/markdown',
        json: 'application/json',
        jpg:  'image/jpeg',
        jpeg: 'image/jpeg',
        png:  'image/png',
        webp: 'image/webp',
        gif:  'image/gif',
        bmp:  'image/bmp',
        tiff: 'image/tiff',
        tif:  'image/tiff',
    };
    return map[ext] || 'application/octet-stream';
}

export async function extractTextByMime(buffer: Buffer, mimeType: string): Promise<ExtractResult> {
    if (mimeType === 'application/pdf') return extractTextFromPDF(buffer);
    if (mimeType.startsWith('image/')) return extractTextFromImage(buffer);
    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
    ) return extractTextFromDocx(buffer);
    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel'
    ) return extractTextFromXlsx(buffer);
    if (mimeType === 'text/csv') return extractTextFromCsv(buffer);
    if (
        mimeType === 'text/plain' ||
        mimeType === 'text/markdown' ||
        mimeType === 'application/json'
    ) return extractTextFromPlain(buffer);

    return { success: false, text: '', error: `Tipo de arquivo não suportado: ${mimeType}` };
}

/**
 * Fetch a file from URL and extract text.
 * @param type - legacy 'pdf'|'image' or full MIME type
 */
export async function extractText(url: string, type: string): Promise<ExtractResult> {
    try {
        const response = await fetch(url);
        if (!response.ok) return { success: false, text: '', error: `HTTP ${response.status}` };
        const buffer = Buffer.from(await response.arrayBuffer());
        // Legacy compat: 'pdf' | 'image'
        const mime = type === 'pdf'   ? 'application/pdf'
                   : type === 'image' ? 'image/jpeg'
                   : type;
        return extractTextByMime(buffer, mime);
    } catch (error: any) {
        return { success: false, text: '', error: error.message };
    }
}
