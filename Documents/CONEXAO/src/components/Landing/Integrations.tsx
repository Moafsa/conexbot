
"use client";

import React from "react";

const integrations = [
    { name: "WhatsApp", src: "https://cdn.simpleicons.org/whatsapp/white" },
    { name: "WordPress", src: "https://cdn.simpleicons.org/wordpress/white" },
    { name: "Mercado Livre", src: "https://cdn.simpleicons.org/mercadolibre/white" },
    { name: "Instagram", src: "https://cdn.simpleicons.org/instagram/white" },
    { name: "Google Ads", src: "https://cdn.simpleicons.org/googleads/white" },
    { name: "Semrush", src: "https://cdn.simpleicons.org/semrush/white" },
    { name: "OpenAI", src: "https://cdn.simpleicons.org/openai/white" },
    { name: "Gemini", src: "https://cdn.simpleicons.org/googlegemini/white" },
    { name: "Stripe", src: "https://cdn.simpleicons.org/stripe/white" },
    { name: "Google Calendar", src: "https://cdn.simpleicons.org/googlecalendar/white" },
    { name: "n8n", src: "https://cdn.simpleicons.org/n8n/white" },
    { name: "ChatWoot", src: "https://cdn.simpleicons.org/chatwoot/white" },
    { name: "ElevenLabs", src: "https://cdn.simpleicons.org/elevenlabs/white" },
    { name: "PostgreSQL", src: "https://cdn.simpleicons.org/postgresql/white" },
    { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs/white" },
    { name: "OpenRouter", src: "https://openrouter.ai/favicon.ico", invert: true },
    { name: "DataForSEO", src: "https://dataforseo.com/wp-content/themes/dataforseo/img/logo.svg", invert: true },
    { name: "Asaas", src: "https://logo.clearbit.com/asaas.com", invert: true },
    { name: "Uzapi", src: "https://uzapi.com.br/wp-content/uploads/2022/03/uzapi-logo-dark.png", invert: true },
    { name: "Conext", src: "https://www.conext.click/img/logo.svg", invert: true },
];

export default function Integrations() {
    return (
        <section className="py-24 relative overflow-hidden bg-black/40 border-y border-white/5" id="integracoes">
            <div className="container mx-auto px-6 text-center mb-16">
                <h3 className="text-xl font-black text-white/30 uppercase tracking-[0.4em]">Ecossistema Global de Integrações</h3>
            </div>

            <div className="relative flex overflow-hidden group">
                {/* Marquee Container */}
                <div className="flex items-center gap-20 whitespace-nowrap animate-marquee py-8">
                    {integrations.map((item, index) => (
                        <div key={index} className="flex-shrink-0 group/item">
                            <img 
                                src={item.src} 
                                alt={item.name} 
                                className={`h-10 md:h-12 w-auto object-contain grayscale opacity-30 group-hover/item:grayscale-0 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500 cursor-pointer ${item.invert ? 'brightness-0 invert group-hover/item:invert-0 group-hover/item:brightness-100' : ''}`}
                            />
                        </div>
                    ))}
                    {/* Duplicate for infinite effect */}
                    {integrations.map((item, index) => (
                        <div key={`dup-${index}`} className="flex-shrink-0 group/item">
                            <img 
                                src={item.src} 
                                alt={item.name} 
                                className={`h-10 md:h-12 w-auto object-contain grayscale opacity-30 group-hover/item:grayscale-0 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500 cursor-pointer ${item.invert ? 'brightness-0 invert group-hover/item:invert-0 group-hover/item:brightness-100' : ''}`}
                            />
                        </div>
                    ))}
                </div>

                {/* Left/Right Fades */}
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10"></div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .group:hover .animate-marquee {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
