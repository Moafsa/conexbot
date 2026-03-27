
"use client";

import React from "react";

const integrations = [
    { name: "WhatsApp", src: "/integrations/whatsapp.svg" },
    { name: "WordPress", src: "/integrations/wordpress.svg" },
    { name: "Uzapi", src: "/integrations/uzapi.png" },
    { name: "Asaas", src: "/integrations/asaas.svg" },
    { name: "Google", src: "/integrations/google.svg" },
    { name: "Google Calendar", src: "/integrations/calendar.svg" },
    { name: "OpenAI", src: "/integrations/openai.svg" },
    { name: "Gemini", src: "/integrations/gemini.png" },
    { name: "OpenRouter", src: "/integrations/openrouter.png" },
    { name: "ElevenLabs", src: "/integrations/elevenlabs.png" },
    { name: "Stripe", src: "/integrations/stripe.svg" },
    { name: "ChatWoot", src: "/integrations/chatwoot.svg" },
    { name: "n8n", src: "/integrations/n8n.svg" },
    { name: "React", src: "/integrations/react.svg" },
    { name: "PostgreSQL", src: "/integrations/postgres.svg" },
    { name: "MinIO", src: "/integrations/minio.svg" },
    { name: "Next.js", src: "/integrations/nextjs.svg" },
    { name: "Conext", src: "/integrations/conext.svg" },
];

export default function Integrations() {
    return (
        <section className="py-24 relative overflow-hidden bg-black/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 italic tracking-tighter">
                        Ecossistema de <span className="text-indigo-500">Integrações</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Conectamos nativamente as tecnologias mais robustas do mundo para garantir escala, 
                        performance e inteligência artificial de ponta em seu negócio.
                    </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-12 gap-y-16 items-center justify-items-center">
                    {integrations.map((item, index) => (
                        <div 
                            key={index} 
                            className="group relative flex items-center justify-center transition-all duration-500"
                        >
                            <img 
                                src={item.src} 
                                alt={item.name} 
                                className="h-12 w-auto object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 cursor-pointer pointer-events-auto"
                                style={{ maxWidth: '120px' }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-indigo-600/5 blur-[150px] -z-10 rounded-full"></div>
        </section>
    );
}
