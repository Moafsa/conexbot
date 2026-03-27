
"use client";

import React from "react";

const integrations = [
    { name: "WhatsApp", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" },
    { name: "WordPress", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Wordpress_Blue_logo.svg" },
    { name: "Uzapi", logo: "/logo.png" }, // Fallback to system logo if uzapi logo not found
    { name: "Asaas", logo: "https://www.asaas.com/assets/img/logo-asaas.svg" },
    { name: "Gemini", logo: "https://www.gstatic.com/lamda/images/favicon_v2_16x16.png" }, // Small icon, but recognizable
    { name: "OpenRouter", logo: "https://openrouter.ai/favicon.ico" },
    { name: "OpenAI", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
    { name: "Google Cloud", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" },
    { name: "Google Calendar", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" },
    { name: "ElevenLabs", logo: "https://elevenlabs.io/static/img/logo.png" },
    { name: "Stripe", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
    { name: "ChatWoot", logo: "https://www.chatwoot.com/images/logo/logo.svg" },
    { name: "n8n", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/N8n_logo.svg" },
    { name: "Conext.click", logo: "https://www.conext.click/img/logo.svg" },
];

export default function Integrations() {
    return (
        <section className="py-20 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 italic tracking-tighter">
                        Ecossistema de <span className="text-indigo-500">Integrações</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Conectamos as melhores ferramentas do mercado para potencializar suas vendas e automações.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center justify-items-center">
                    {integrations.map((item, index) => (
                        <div 
                            key={index} 
                            className="group relative flex flex-col items-center justify-center p-6 grayscale transition-all duration-500 hover:grayscale-0 hover:scale-110 active:scale-95 cursor-pointer"
                        >
                            <img 
                                src={item.logo} 
                                alt={item.name} 
                                className="h-10 w-auto object-contain brightness-0 invert opacity-50 group-hover:brightness-100 group-hover:invert-0 group-hover:opacity-100 transition-all duration-500"
                                onError={(e) => {
                                    // Fallback for missing/broken logos
                                    (e.target as any).src = "https://www.conext.click/img/logo.svg";
                                }}
                            />
                            <span className="absolute -bottom-4 text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:bottom-2 transition-all duration-300">
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/5 blur-[150px] -z-10 rounded-full"></div>
        </section>
    );
}
