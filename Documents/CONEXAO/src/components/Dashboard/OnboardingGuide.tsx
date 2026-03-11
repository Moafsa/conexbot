"use client";

import { CheckCircle2, QrCode, Bot, Key, ArrowRight, CreditCard } from "lucide-react";

interface OnboardingGuideProps {
    onboarding: {
        hasAiKeys: boolean;
        hasBots: boolean;
        hasConnections: boolean;
        hasElevenLabs: boolean;
        hasAsaas: boolean;
        hasVoiceConfig: boolean;
        hasAdvancedConfig: boolean;
    };
}

export default function OnboardingGuide({ onboarding }: OnboardingGuideProps) {
    const { hasAiKeys, hasBots, hasConnections, hasElevenLabs, hasAsaas, hasVoiceConfig, hasAdvancedConfig } = onboarding;
    
    // If everything essential is done, we could show a more minimal version or advanced tips
    const isBasicDone = hasAiKeys && hasBots && hasConnections;

    const steps = [
        {
            id: "keys",
            title: "1. Chaves de API",
            desc: "Configure suas chaves da OpenAI ou Gemini para ativar a inteligência.",
            icon: <Key className={`w-6 h-6 ${hasAiKeys ? 'text-green-400' : 'text-purple-400'}`} />,
            link: "/dashboard/settings",
            isDone: hasAiKeys
        },
        {
            id: "bot",
            title: "2. Criar seu Agente",
            desc: "Use nosso Arquiteto IA para desenhar a personalidade do seu bot.",
            icon: <Bot className={`w-6 h-6 ${hasBots ? 'text-green-400' : 'text-blue-400'}`} />,
            link: "/dashboard/create-bot",
            isDone: hasBots,
            disabled: !hasAiKeys
        },
        {
            id: "whatsapp",
            title: "3. Conectar WhatsApp",
            desc: "Escaneie o QR Code para seu bot começar a responder clientes.",
            icon: <QrCode className={`w-6 h-6 ${hasConnections ? 'text-green-400' : 'text-amber-400'}`} />,
            link: "/dashboard/connect",
            isDone: hasConnections,
            disabled: !hasBots
        },
        {
            id: "voice",
            title: "4. Voz & ElevenLabs",
            desc: "Configure ElevenLabs e escolha uma voz para áudios realistas.",
            icon: <Key className={`w-6 h-6 ${hasVoiceConfig ? 'text-green-400' : 'text-pink-400'}`} />,
            link: "/dashboard/settings",
            isDone: hasElevenLabs && hasVoiceConfig,
            disabled: !hasBots,
            advanced: true
        },
        {
            id: "asaas",
            title: "5. Pagamentos Asaas",
            desc: "Configure seu Asaas para vender e cobrar no checkout.",
            icon: <CreditCard className={`w-6 h-6 ${hasAsaas ? 'text-green-400' : 'text-emerald-400'}`} />,
            link: "/dashboard/settings",
            isDone: hasAsaas,
            advanced: true
        }
    ];

    const visibleSteps = steps.filter(s => !s.advanced || (isBasicDone && !s.isDone) || s.advanced);

    return (
        <div className="glass p-6 rounded-2xl mb-8 border-purple-500/20 bg-gradient-to-r from-purple-900/10 to-transparent">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <CheckCircle2 className="text-purple-500" /> Complete sua Configuração
                </h2>
                <span className="text-xs text-gray-500 font-mono">
                    {steps.filter(s => s.isDone).length} de {steps.length} concluídos
                </span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                {visibleSteps.slice(0, 3).map((step, i) => (
                    <div 
                        key={i} 
                        className={`p-4 rounded-xl border transition-all flex flex-col ${
                            step.isDone 
                                ? 'border-green-500/20 bg-green-500/5 opacity-80' 
                                : step.disabled 
                                    ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-black/20 rounded-lg">{step.icon}</div>
                            {step.isDone && <CheckCircle2 className="text-green-500 w-5 h-5" />}
                        </div>
                        
                        <h3 className={`font-semibold ${step.isDone ? 'text-green-400' : 'text-white'}`}>
                            {step.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 flex-grow">
                            {step.desc}
                        </p>

                        {!step.isDone && !step.disabled && (
                            <a 
                                href={step.link}
                                className="mt-4 flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                CONFIGURAR AGORA <ArrowRight size={12} />
                            </a>
                        )}
                        {step.disabled && (
                            <span className="mt-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                Bloqueado (Complete o passo anterior)
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
