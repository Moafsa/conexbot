import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['pdfjs-dist', '@napi-rs/canvas'],
    /* config options here */
    experimental: {
        turbopack: {
            root: '.',
        },
    } as any,
};

export default nextConfig;
