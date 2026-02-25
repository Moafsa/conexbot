
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Bot className="w-4 h-4" />
                    <span>Ambiente de Teste (Simulador)</span>
                </div>
                <div className="text-xs text-gray-400">
                    Sessão: {sessionId}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]/30">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        <p>Mande um "Oi" para começar a testar!</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none shadow-sm'
                                    : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                                }`}
                        >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            <span className="text-[10px] text-gray-400 block text-right mt-1">
                                {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm border border-gray-100">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
