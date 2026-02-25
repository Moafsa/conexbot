"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function TestChatPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [botId, setBotId] = useState<string>('');
    const [bot, setBot] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        params.then(p => setBotId(p.id));
    }, [params]);

    useEffect(() => {
        if (!botId) return;

        // Fetch bot details
        fetch(`/api/bots/${botId}`)
            .then(res => res.json())
            .then(data => {
                setBot(data);
                setInitializing(false);

                // Add welcome message
                setMessages([{
                    role: 'assistant',
                    content: `Olá! Sou o ${data.name}. Como posso ajudar você hoje?`,
                    timestamp: new Date(),
                }]);
            })
            .catch(err => {
                console.error('Error fetching bot:', err);
                setInitializing(false);
            });
    }, [botId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !bot) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Simulate bot response using the same processor logic
            const res = await fetch('/api/test-bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    botId: bot.id,
                    message: input,
                    history: messages,
                }),
            });

            const data = await res.json();

            const botMessage: Message = {
                role: 'assistant',
                content: data.response || 'Desculpe, não consegui processar sua mensagem.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Erro ao processar mensagem. Tente novamente.',
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    if (!bot) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-gray-400">Bot não encontrado</p>
                <Link href="/dashboard/bots" className="btn-primary">
                    Voltar para Bots
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-950">
            {/* Header */}
            <div className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/bots')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 uppercase font-bold">
                            {bot.name.substring(0, 2)}
                        </div>
                        <div>
                            <h1 className="font-bold">{bot.name}</h1>
                            <p className="text-sm text-gray-400">Teste do Bot</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-500">Ativo</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-emerald-600/20 text-emerald-400'
                            }`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white/5 text-gray-100'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                            <Bot size={16} className="text-emerald-400" />
                        </div>
                        <div className="bg-white/5 px-4 py-3 rounded-2xl">
                            <Loader2 className="animate-spin text-gray-400" size={16} />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="glass border-t border-white/10 px-6 py-4">
                <form onSubmit={sendMessage} className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
