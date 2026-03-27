
"use client";

import React from "react";

// Mapeamento de logos usando CDN de alta fidelidade (SimpleIcons) para garantir versões brancas no tema dark
const integrations = [
    { name: "WhatsApp", src: "https://cdn.simpleicons.org/whatsapp/white" },
    { name: "WordPress", src: "https://cdn.simpleicons.org/wordpress/white" },
    { name: "Uzapi", src: "https://uzapi.com.br/wp-content/uploads/2022/03/uzapi-logo-dark.png", invert: true },
    { 
        name: "Asaas", 
        src: "https://logo.clearbit.com/asaas.com", 
        customSvg: (
            <svg viewBox="0 0 127 38" className="h-full w-auto fill-current">
                <path d="M83.3201 2.65662C83.597 5.4048 82.6979 8.24063 80.8551 10.4396C80.8259 10.4757 80.8159 10.5232 80.8292 10.5673C81.7975 13.7116 80.563 17.4003 77.8271 19.5371L76.8023 20.5419C76.7743 20.5693 76.7597 20.6075 76.7617 20.6469C76.9181 23.3677 75.468 26.0483 73.0669 27.4752L71.5669 28.3663C71.5362 28.3851 71.5129 28.4158 71.5043 28.4513C71.4957 28.4861 71.5016 28.5235 71.5203 28.5543L71.5236 28.5597L71.5848 28.6587H71.5822L76.3697 36.7942C76.4156 36.8724 76.4403 36.9634 76.4403 37.0551C76.4403 37.326 76.2313 37.5495 75.9744 37.5535L73.59 37.5568C73.3364 37.5568 73.1041 37.4217 72.9697 37.1956L72.1498 35.8014C72.1478 35.7981 72.1458 35.794 72.1445 35.79L70.1008 32.3234C70.0722 32.2745 70.0176 32.2511 69.963 32.2632C67.7942 32.7783 65.5814 33.0398 63.3873 33.0398C61.1413 33.0398 58.8812 32.7676 56.6685 32.2297C56.6172 32.2177 56.5573 32.2437 56.5294 32.2912L53.6984 37.1942C53.5626 37.421 53.331 37.5561 53.0775 37.5561H53.0502L50.6464 37.5528C50.3882 37.5495 50.1793 37.3253 50.1793 37.0544C50.1793 36.9628 50.2039 36.8724 50.2491 36.7942L51.5042 34.6661C51.5069 34.6615 51.5096 34.6574 51.5129 34.6541L55.0147 28.658H55.0054L55.0693 28.5543C55.0886 28.5235 55.0946 28.4854 55.0859 28.4506C55.0773 28.4145 55.0546 28.3837 55.0234 28.3657L53.5234 27.4746C51.1223 26.047 49.6721 23.367 49.8292 20.6463C49.8312 20.6068 49.8166 20.5687 49.7886 20.5412L48.7637 19.5364C46.0279 17.4003 44.7934 13.7116 45.7617 10.5667C45.775 10.5225 45.7657 10.4744 45.7358 10.4389C43.893 8.23996 42.9946 5.40414 43.2714 2.65595C43.3466 2.14552 43.5616 1.22968 44.1592 0.830295C44.2391 0.782128 44.3129 0.742659 44.3841 0.710547C44.5465 0.636959 44.7176 0.601503 44.8932 0.608862C44.9179 0.6102 44.9405 0.622241 44.9545 0.64298C46.0113 2.17094 48.0497 4.53914 51.7618 7.14951C53.6438 8.47343 55.1026 9.36519 56.3218 10.0977C56.3284 10.1011 56.6512 10.2951 56.6512 10.2951C57.0025 10.5058 57.3213 10.6971 57.6215 10.8818C58.1585 11.2377 58.6337 11.6016 59.0576 11.9608C60.0565 12.8385 62.1634 15.0288 62.4769 18.1228C62.4769 18.1228 62.8363 20.582 61.2464 23.834L58.3801 29.1082C58.3582 29.1464 58.3548 29.1939 58.3721 29.2347C58.3894 29.2755 58.4247 29.3049 58.4666 29.3129C60.1017 29.6253 61.7575 29.7832 63.3873 29.7832C64.9618 29.7832 66.563 29.6354 68.1456 29.3437C68.1875 29.3357 68.2234 29.3069 68.2407 29.2654C68.258 29.2246 68.2554 29.1771 68.2327 29.139L68.077 28.8533L68.075 28.85L67.1819 27.211H67.1833L65.3112 23.7711C63.7566 20.5513 64.1107 18.1235 64.1107 18.1235C64.4161 15.1104 66.4219 12.955 67.4495 12.0331C67.8933 11.6504 68.3978 11.2618 68.9701 10.8824C69.246 10.7121 69.5377 10.5372 69.8559 10.3464L70.2698 10.0984C71.489 9.36586 72.9478 8.47343 74.8298 7.15018C78.5419 4.53981 80.5803 2.17094 81.6371 0.643649C81.6511 0.62291 81.6737 0.6102 81.6983 0.609531C81.874 0.602841 82.045 0.637628 82.2074 0.711216C82.2786 0.743328 82.3525 0.782797 82.4324 0.830964C83.03 1.23035 83.2449 2.14619 83.3201 2.65662Z" fill="#0030FF"/>
            </svg>
        )
    },
    { name: "OpenAI", src: "https://cdn.simpleicons.org/openai/white" },
    { name: "Gemini", src: "https://cdn.simpleicons.org/googlegemini/white" },
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
                    {integrations.map((item: any, index) => (
                        <div 
                            key={index} 
                            className="group relative flex items-center justify-center transition-all duration-700 h-12 md:h-14"
                        >
                            {item.customSvg ? (
                                <div className="h-full w-auto grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 cursor-pointer">
                                    {item.customSvg}
                                </div>
                            ) : (
                                <img 
                                    src={item.src} 
                                    alt={item.name} 
                                    className={`h-full w-auto object-contain grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 cursor-pointer ${item.invert ? 'brightness-0 invert group-hover:invert-0 group-hover:brightness-100' : ''}`}
                                />
                            )}
                            
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
