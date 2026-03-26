'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function WebChatWidget() {
    const params = useParams();
    const botId = params.botId as string;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [botName, setBotName] = useState('Assistente IA');
    const [sessionId, setSessionId] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Inicializar ID de sessão único
        if (typeof window !== 'undefined') {
            let sId = localStorage.getItem(`conext_session_${botId}`);
            if (!sId) {
                sId = Math.random().toString(36).substring(2, 15);
                localStorage.setItem(`conext_session_${botId}`, sId);
            }
            setSessionId(sId);
            
            // Buscar informações do bot
            fetch(`/api/v1/bot-info/${botId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.name) setBotName(data.name);
                })
                .catch(err => console.error('Error fetching bot info:', err));

            // Mensagem de boas-vindas (opcional)
            setMessages([{
                role: 'assistant',
                content: 'Olá! Como posso ajudar você hoje?',
                timestamp: new Date()
            }]);
        }
    }, [botId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/v1/webchat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    botId,
                    message: userMsg.content,
                    sessionId
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ${res.status}`);
            }

            const data = await res.json();
            
            if (data.text) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.text,
                    timestamp: new Date()
                }]);
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Desculpe, não consegui processar sua mensagem. (Erro: ${error.message})`,
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">{botName}</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Online agora</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                            m.role === 'user' 
                                ? 'bg-violet-600 text-white rounded-tr-none' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                        }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1 pl-4 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
                    <input 
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 py-2"
                        placeholder="Digite sua mensagem..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center text-white hover:bg-violet-700 transition-colors"
                    >
                        <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">Powered by <b>Conext.click</b></p>
                </div>
            </div>
        </div>
    );
}
