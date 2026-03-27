
"use client";

import React from "react";

// Mapeamento de logos usando CDN de alta fidelidade (SimpleIcons) para garantir versões brancas no tema dark
const integrations = [
    { name: "WhatsApp", src: "https://cdn.simpleicons.org/whatsapp/white" },
    { name: "WordPress", src: "https://cdn.simpleicons.org/wordpress/white" },
    { name: "Uzapi", src: "https://uzapi.com.br/wp-content/uploads/2022/03/uzapi-logo-dark.png", invert: true },
    { name: "Asaas", src: "https://asaas.com/assets/img/logo-asaas.svg", invert: true },
    { name: "OpenAI", src: "https://cdn.simpleicons.org/openai/white" },
    { name: "Gemini", src: "https://cdn.simpleicons.org/google-gemini/white" },
    { name: "Google", src: "https://cdn.simpleicons.org/google/white" },
    { name: "Google Calendar", src: "https://cdn.simpleicons.org/googlecalendar/white" },
    { name: "Stripe", src: "https://cdn.simpleicons.org/stripe/white" },
    { name: "ElevenLabs", src: "https://cdn.simpleicons.org/elevenlabs/white" },
    { name: "n8n", src: "https://cdn.simpleicons.org/n8n/white" },
    { name: "ChatWoot", src: "https://cdn.simpleicons.org/chatwoot/white" },
    { name: "React", src: "https://cdn.simpleicons.org/react/white" },
    { name: "PostgreSQL", src: "https://cdn.simpleicons.org/postgresql/white" },
    { name: "MinIO", src: "https://cdn.simpleicons.org/minio/white" },
    { name: "Next.js", src: "https://cdn.simpleicons.org/nextdotjs/white" },
    { name: "OpenRouter", src: "https://openrouter.ai/favicon.ico", invert: true },
    { name: "Conext", src: "https://www.conext.click/img/logo.svg", invert: true },
];

export default function Integrations() {
    return (
        <section className="py-32 relative overflow-hidden bg-black/40">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 italic tracking-tighter">
                        Ecossistema de <span className="text-indigo-500">Integrações</span>
                    </h2>
                    <p className="text-gray-400 max-w-3xl mx-auto text-xl leading-relaxed font-light">
                        Conectividade nativa com as maiores potências tecnológicas do mundo 
                        para escalar sua operação com inteligência.
                    </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-16 gap-y-24 items-center justify-items-center">
                    {integrations.map((item, index) => (
                        <div 
                            key={index} 
                            className="group relative flex items-center justify-center transition-all duration-700"
                        >
                            <img 
                                src={item.src} 
                                alt={item.name} 
                                className={`h-12 md:h-14 w-auto object-contain grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 cursor-pointer ${item.invert ? 'brightness-0 invert group-hover:invert-0 group-hover:brightness-100' : ''}`}
                            />
                            
                            {/* Subtle Glow on Hover */}
                            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 blur-2xl transition-all duration-700 rounded-full -z-10"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Background Aesthetic */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-indigo-600/10 blur-[180px] -z-10 rounded-full"></div>
        </section>
    );
}
