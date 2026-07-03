import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export async function optimizePdf(buffer: Buffer): Promise<Buffer> {
    try {
        const pdfDoc = await PDFDocument.load(buffer);
        const compressedUint8 = await pdfDoc.save({ useObjectStreams: false });
        return Buffer.from(compressedUint8);
    } catch (error) {
        console.error("[MediaOptimizer] PDF optimization failed:", error);
        return buffer;
    }
}

export async function optimizeMedia(buffer: Buffer, mimetype: string, filename: string) {
    // Sharp only handles non-gif standard images for compression
    if (mimetype.startsWith("image/") && !mimetype.includes("gif") && !mimetype.includes("svg")) {
        try {
            const optimizedBuffer = await sharp(buffer)
                .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            
            // Re-extend filename to end with .webp
            const dotIndex = filename.lastIndexOf(".");
            const baseName = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
            const newFilename = `${baseName}.webp`;
            
            return { buffer: optimizedBuffer, mimetype: "image/webp", filename: newFilename };
        } catch (err) {
            console.error("[MediaOptimizer] Sharp optimization failed, fallback to original:", err);
            return { buffer, mimetype, filename };
        }
    }
    
    if (mimetype === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
        const optimizedBuffer = await optimizePdf(buffer);
        return { buffer: optimizedBuffer, mimetype: "application/pdf", filename };
    }
    
    // Fallback for videos and other files (no compression)
    return { buffer, mimetype, filename };
}
