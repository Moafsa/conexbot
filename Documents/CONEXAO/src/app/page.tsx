export const dynamic = 'force-dynamic';
import Navbar from "@/components/Landing/Navbar";
import Hero from "@/components/Landing/Hero";
import Features from "@/components/Landing/Features";
import Pricing from "@/components/Landing/Pricing";
import Integrations from "@/components/Landing/Integrations";
import Footer from "@/components/Landing/Footer";
import prisma from "@/lib/prisma";

import BrandStory from "@/components/Landing/BrandStory";

export default async function Home() {
    const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
    const dbTiers = await prisma.agencyTier.findMany({
        orderBy: { minSalesVolume: 'asc' }
    });

    return (
        <div className="min-h-screen flex flex-col bg-[#050505] selection:bg-cyan-500/30">
            <Navbar branding={config} />
            <main className="flex-grow pt-20">
                <Hero branding={config} />
                
                <Integrations />

                <Features />
                
                <BrandStory />
                
                <Pricing tiers={dbTiers} />
            </main>
            <Footer branding={config} />

            {/* Background Glows Sutil */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[180px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-purple-600/10 rounded-full blur-[180px] animate-pulse delay-1000"></div>
            </div>
        </div>
    );
}
