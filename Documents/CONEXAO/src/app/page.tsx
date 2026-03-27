import Navbar from "@/components/Landing/Navbar";
export const dynamic = 'force-dynamic';
import Hero from "@/components/Landing/Hero";
import Features from "@/components/Landing/Features";
import Pricing from "@/components/Landing/Pricing";
import Integrations from "@/components/Landing/Integrations";
import Footer from "@/components/Landing/Footer";
import prisma from "@/lib/prisma";

import BrandStory from "@/components/Landing/BrandStory";

export default async function Home() {
    const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });

    return (
        <div className="min-h-screen flex flex-col bg-[#050505] selection:bg-cyan-500/30">
            <Navbar branding={config} />
            <main className="flex-grow pt-20">
                <Hero branding={config} />
                
                {/* Partner Ecosystem (Untouched as requested) */}
                <Integrations />

                <Features />
                
                <BrandStory />
                
                <Pricing />
            </main>
            <Footer />

            {/* Background Glows Premium (Purple/Indigo) */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px] animate-pulse delay-700"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-pink-600/10 rounded-full blur-[140px] animate-pulse delay-1000"></div>
            </div>
        </div>
    );
}
