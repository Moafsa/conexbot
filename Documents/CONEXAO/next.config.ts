import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['pdfjs-dist', '@napi-rs/canvas'],
    /* config options here */
};

export default nextConfig;
