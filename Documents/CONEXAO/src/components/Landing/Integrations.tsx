
"use client";

import React from "react";

const integrations = [
    {
        name: "WhatsApp",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
        )
    },
    {
        name: "WordPress",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#21759b]">
                <path d="M12.001 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 18.836c-2.43 0-4.63-.984-6.225-2.57l3.05-8.358 1.94 5.318 1.235-3.377 1.235 3.377 1.94-5.318 3.05 8.358c-1.595 1.586-3.795 2.57-6.225 2.57zM2 12c0 1.264.235 2.473.662 3.593L7.756 3.03C4.346 4.673 2 8.06 2 12zm10 10c-1.264 0-2.473-.235-3.593-.662l12.563-5.094C19.327 19.654 15.94 22 12 22z"/>
            </svg>
        )
    },
    {
        name: "Uzapi",
        svg: (
            <svg viewBox="0 0 450 150" className="w-20 h-auto">
                <rect x="0" y="20" width="100" height="100" rx="25" fill="#2eb68b" />
                <path d="M85 110 L100 135 L115 110" fill="#2eb68b" />
                <text x="50" y="95" fontFamily="Arial" fontSize="70" fontWeight="900" textAnchor="middle" fill="white">U</text>
                <text x="120" y="105" fontFamily="sans-serif" fontSize="100" fontWeight="900" fill="#2eb68b" letterSpacing="-5">zapi</text>
            </svg>
        )
    },
    {
        name: "Asaas",
        svg: (
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-[#0030B9]">
                <path d="M12 2L1 21h22L12 2zm0 4.5L19.5 19h-15L12 6.5z"/>
                <path d="M10 14h4v2h-4z"/>
            </svg>
        )
    },
    {
        name: "Google",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
        )
    },
    {
        name: "Google Calendar",
        svg: (
             <svg viewBox="0 0 24 24" className="w-10 h-10">
                <rect width="24" height="24" rx="3" fill="#FFF"/>
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" fill="#4285f4"/>
                <path d="M12 12h5v5h-5z" fill="#ea4335"/>
            </svg>
        )
    },
    {
        name: "Gemini",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#4285F4]">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
            </svg>
        )
    },
    {
        name: "OpenAI",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9108 6.0462 6.0462 0 0 0-3.9998-3.0847 5.9922 5.9922 0 0 0-5.1189.9234 6.0452 6.0452 0 0 0-2.4347-1.1856 5.993 5.993 0 0 0-4.7831.6506 6.0441 6.0441 0 0 0-3.0317 3.7345 5.9902 5.9902 0 0 0 .3411 5.1583 6.0441 6.0441 0 0 0 .5153 4.9108 6.0462 6.0462 0 0 0 3.9998 3.0847 5.9922 5.9922 0 0 0 5.1189-.9234 6.0452 6.0452 0 0 0 2.4347 1.1856 5.993 5.993 0 0 0 4.7831-.6506 6.0441 6.0441 0 0 0 3.0317-3.7345 5.9902 5.9902 0 0 0-.3411-5.1583Z M12 6.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5Z"/>
            </svg>
        )
    },
    {
        name: "ElevenLabs",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
                <path d="M4 4h4l4 16h-4zM16 4h4l-4 16h-4z"/>
            </svg>
        )
    },
    {
        name: "Stripe",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#635BFF]">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921 1.605 9.15z"/>
            </svg>
        )
    },
    {
        name: "React",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#61DAFB]">
                <circle cx="12" cy="12" r="2.03" />
                <path d="M23.95 9.69c-.19-1.2-1.28-2.61-2.92-3.83-2.03-1.5-4.88-2.16-7.53-1.78a16.88 16.88 0 0 0-4.5 1.78c-2.03 1.2-3.83 2.61-4.5 3.83-.34.6-.34 1.34 0 1.94.19 1.2 1.28 2.61 2.92 3.83s4.88 2.16 7.53 1.78a16.88 16.88 0 0 0 4.5-1.78c2.03-1.2 3.83-2.61 4.5-3.83.34-.6.34-1.34 0-1.94z" opacity=".3"/>
            </svg>
        )
    },
    {
        name: "PostgreSQL",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#336791]">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                <path d="M15 11c0-1.654-1.346-3-3-3s-3 1.346-3 3 1.346 3 3 3 3-1.346 3-3z"/>
            </svg>
        )
    },
    {
        name: "Next.js",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 17l-5.333-7.5h-1.667v7.5h-1.5v-10h1.5l5.333 7.5h1.667v-7.5h1.5v10h-1.5z"/>
            </svg>
        )
    },
    {
        name: "Minio",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#ea1f33]">
                <path d="M12 0L2 12l10 12 10-12L12 0zm0 4l7 8-7 8-7-8 7-8z"/>
            </svg>
        )
    },
    {
        name: "Conext.click",
        svg: (
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 4l7 6-7 6-7-6 7-6z"/>
            </svg>
        )
    }
];

export default function Integrations() {
    return (
        <section className="py-24 relative overflow-hidden bg-black/20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 italic tracking-tighter">
                        Ecossistema de <span className="text-indigo-500">Integrações</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Conectamos nativamente as tecnologias mais robustas do mundo para garantir escala e performance.
                    </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-12 gap-y-16 items-center justify-items-center">
                    {integrations.map((item, index) => (
                        <div 
                            key={index} 
                            className="relative flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-125 transition-all duration-500 cursor-pointer"
                        >
                            {item.svg}
                        </div>
                    ))}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-indigo-600/5 blur-[120px] -z-10 rounded-full"></div>
        </section>
    );
}
