import Hero from "@/components/Landing/Hero";
import Features from "@/components/Landing/Features";
import Pricing from "@/components/Landing/Pricing";
import Footer from "@/components/Landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />

      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      </div>
    </div>
  );
}
