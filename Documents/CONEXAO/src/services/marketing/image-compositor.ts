import sharp from 'sharp';

export class ImageCompositor {
    /**
     * Cria um criativo profissional sobrepondo design à imagem (Buffer)
     */
    static async createCreative(params: {
        imageBuffer: Buffer;
        headline: string;
    }): Promise<Buffer> {
        try {
            const width = 1024;
            const height = 1024;

            // Headline em Português (limitar tamanho)
            const cleanHeadline = params.headline.substring(0, 55).toUpperCase();

            // SVG Overlay Profissional
            const svgOverlay = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:black;stop-opacity:0" />
                        <stop offset="60%" style="stop-color:black;stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:black;stop-opacity:0.95" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.4" />
                        <stop offset="30%" style="stop-color:#10b981;stop-opacity:0" />
                    </linearGradient>
                </defs>
                
                <!-- Luz Superior (Glow) -->
                <rect width="${width}" height="400" fill="url(#grad2)" />

                <!-- Degradê Inferior (Sombra para Texto) -->
                <rect width="${width}" height="600" y="424" fill="url(#grad1)" />

                <!-- Barra Lateral de Design -->
                <rect x="40" y="760" width="10" height="140" fill="#10b981" rx="5" />

                <!-- Título em Português -->
                <text x="75" y="830" font-family="sans-serif" font-weight="900" font-size="56" fill="white" font-style="italic">
                    ${this.escapeXml(cleanHeadline)}
                </text>

                <!-- Tag Conext -->
                <rect x="75" y="865" width="220" height="34" rx="17" fill="#10b981" />
                <text x="185" y="888" font-family="sans-serif" font-weight="900" font-size="14" fill="black" text-anchor="middle" letter-spacing="1">
                    MARKETING INTELIGENTE
                </text>
            </svg>
            `;

            // Composição Sharp
            return await sharp(params.imageBuffer)
                .resize(width, height)
                .composite([
                    {
                        input: Buffer.from(svgOverlay),
                        top: 0,
                        left: 0,
                    }
                ])
                .png()
                .toBuffer();
        } catch (error) {
            console.error("[ImageCompositor] Erro na composição:", error);
            throw error;
        }
    }

    private static escapeXml(unsafe: string) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
            return c;
        });
    }
}
