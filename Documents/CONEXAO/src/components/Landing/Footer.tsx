import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

export default function Footer({ branding }: { branding?: any }) {
    return (
        <footer className="py-20 border-t border-white/5 bg-black/40">
            <div className="container mx-auto px-6 text-center">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                    <div className="flex items-center space-x-3 mb-8 md:mb-0">
                         {branding?.logoWhiteUrl ? (
                             <img src={branding.logoWhiteUrl} alt={branding.systemName} className="h-8 w-auto" />
                         ) : (
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-black italic text-sm">
                                    {(branding?.systemName || "Conext")[0]}
                                </span>
                            </div>
                         )}
                        <span className="text-xl font-black italic tracking-tighter text-white">
                            {branding?.systemName || "Conext"}
                        </span>
                    </div>

                    <div className="flex space-x-12 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Termos</Link>
                        <Link href="/support" className="hover:text-white transition-colors">Suporte</Link>
                    </div>

                    <div className="flex space-x-6 mt-8 md:mt-0">
                        <Link href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-indigo-600 transition-all text-white">
                            <Instagram size={20} />
                        </Link>
                        <Link href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-indigo-600 transition-all text-white">
                            <Linkedin size={20} />
                        </Link>
                        <Link href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-indigo-600 transition-all text-white">
                            <Twitter size={20} />
                        </Link>
                    </div>
                </div>

                <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
                    © 2025 {branding?.systemName || "Conext"} AI Infrastructure — Conectando Ideias. Gerando Futuro.
                </div>
            </div>
        </footer>
    );
}
