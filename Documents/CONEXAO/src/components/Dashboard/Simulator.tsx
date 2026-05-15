
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Mic, Square, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

export function Simulator({ botId }: { botId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sessionId] = useState(() => `SIM_${Math.random().toString(36).substring(7)}`);
    
    // Audio States
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptionLoading, setTranscriptionLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioUpload(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("Erro ao acessar microfone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioUpload = async (blob: Blob) => {
        setTranscriptionLoading(true);
        const formData = new FormData();
        formData.append('file', blob, 'audio.webm');

        try {
            const res = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.text) {
                setInput(data.text);
                toast.success("Áudio transcrito!");
            } else {
                toast.error(data.error || "Erro na transcrição.");
            }
        } catch (err) {
            toast.error("Falha ao transcrever áudio.");
        } finally {
            setTranscriptionLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            createdAt: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch('/api/simulator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    botId,
                    message: userMsg.content,
                    sessionId
                })
            });

            if (res.ok) {
                const data = await res.json();
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.response,
                    createdAt: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                console.error("Simulator error", await res.text());
            }
        } catch (error) {
            console.error("Network error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[650px] bg-white/[0.02] backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl relative group text-white">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-emerald-500/5 blur-[120px] -z-10 pointer-events-none"></div>

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-200 uppercase tracking-widest">Ambiente de Teste</h3>
                        <p className="text-[10px] text-gray-500 font-bold">SIMULADOR OFICIAL CONEXT</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono text-gray-500">
                    ID: {sessionId}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 mb-2">
                            <MessageCircle size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 font-medium">Mande um "Oi" para começar!</p>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mt-1">O agente responderá em tempo real</p>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl p-4 relative group ${msg.role === 'user'
                                ? 'bg-emerald-500 text-black font-medium rounded-tr-none shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/10'
                                }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <span className={`text-[10px] block mt-2 opacity-40 font-bold ${msg.role === 'user' ? 'text-black' : 'text-gray-400'}`}>
                                {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 rounded-tl-none">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="flex items-center gap-3 bg-black/40 border border-white/5 p-2 rounded-[24px] focus-within:border-emerald-500/50 transition-all duration-300">
                    <button 
                        onClick={isRecording ? stopRecording : startRecording} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                        disabled={transcriptionLoading}
                        title="Enviar áudio"
                    >
                        {transcriptionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? <Square size={18} /> : <Mic size={20} />}
                    </button>
                    
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={transcriptionLoading ? "Transcrevendo áudio..." : "Digite sua mensagem aqui..."}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600 px-2"
                        disabled={loading || transcriptionLoading}
                    />

                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim() || transcriptionLoading}
                        className="w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center hover:bg-emerald-400 transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Send size={18} className="ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
