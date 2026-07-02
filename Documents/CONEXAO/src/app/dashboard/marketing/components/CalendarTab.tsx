"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Check, AlertCircle, Sparkles, Plus } from "lucide-react";

interface CalendarTabProps {
    selectedClientId: string;
    bots: any[];
    onEditPost: (post: any) => void;
    onNavigateToCreate: (date: string) => void;
}

export function CalendarTab({ selectedClientId, bots, onEditPost, onNavigateToCreate }: CalendarTabProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showBestTimes, setShowBestTimes] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const query = selectedClientId ? `&clientId=${selectedClientId}` : "";
            const res = await fetch(`/api/marketing/posts?limit=100${query}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Erro ao carregar posts para o calendário:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [selectedClientId]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Helper functions for calendar grid
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const totalDays = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Mock best times for "Melhores horários - IA" (based on client/bot niche)
    const bestTimes = ["09:00", "15:00", "20:00"];

    // Group posts by day
    const getPostsForDay = (day: number) => {
        return posts.filter(post => {
            const dateStr = post.scheduledAt || post.publishedAt || post.createdAt;
            if (!dateStr) return false;
            const date = new Date(dateStr);
            return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
        });
    };

    // Calendar grid days array
    const gridDays = [];
    
    // Padding for previous month days
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        gridDays.push({
            day: daysInPrevMonth - i,
            isCurrentMonth: false,
            month: prevMonth,
            year: prevMonthYear
        });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
        gridDays.push({
            day: i,
            isCurrentMonth: true,
            month: month,
            year: year
        });
    }

    // Padding for next month days to make grid complete (multiple of 7)
    const totalGridSlots = 42; // 6 rows of 7 days
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthPadding = totalGridSlots - gridDays.length;
    
    for (let i = 1; i <= nextMonthPadding; i++) {
        gridDays.push({
            day: i,
            isCurrentMonth: false,
            month: nextMonth,
            year: nextMonthYear
        });
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">{monthNames[month]} {year}</h2>
                        <p className="text-gray-400 text-xs mt-0.5">Calendário Visual de Conteúdo</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    {/* IA Best Times Button */}
                    <button
                        onClick={() => setShowBestTimes(!showBestTimes)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all ${
                            showBestTimes 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/5" 
                            : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                        <Sparkles size={14} className={showBestTimes ? "animate-pulse" : ""} />
                        Melhores Horários - IA
                    </button>

                    {/* Navigation Buttons */}
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                        <button 
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Hoje
                        </button>
                        <button 
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-white/10 rounded-3xl overflow-hidden bg-black/20">
                {/* Days of Week Headers */}
                <div className="grid grid-cols-7 border-b border-white/10 bg-white/5 text-center py-3 text-xs font-black uppercase tracking-widest text-gray-500">
                    {daysOfWeek.map((day, idx) => (
                        <div key={idx}>{day}</div>
                    ))}
                </div>

                {/* Days Cells */}
                <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-white/5">
                    {gridDays.map((cell, idx) => {
                        const dayPosts = cell.isCurrentMonth ? getPostsForDay(cell.day) : [];
                        const isToday = new Date().getDate() === cell.day && new Date().getMonth() === cell.month && new Date().getFullYear() === cell.year;
                        
                        // Format ISO date YYYY-MM-DD
                        const isoDate = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;

                        return (
                            <div 
                                key={idx} 
                                className={`min-h-[130px] p-2 relative group flex flex-col justify-between transition-colors ${
                                    cell.isCurrentMonth 
                                    ? "bg-transparent" 
                                    : "bg-white/[0.01] text-gray-600"
                                } ${isToday ? "bg-emerald-500/[0.03]" : ""}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${
                                        isToday 
                                        ? "w-6 h-6 bg-emerald-500 text-black flex items-center justify-center rounded-full" 
                                        : cell.isCurrentMonth ? "text-gray-400" : "text-gray-600"
                                    }`}>
                                        {cell.day}
                                    </span>

                                    {/* Quick Create Button */}
                                    {cell.isCurrentMonth && (
                                        <button
                                            onClick={() => onNavigateToCreate(isoDate)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-400 rounded-md transition-all"
                                            title="Agendar Post para este dia"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Day Content Area */}
                                <div className="mt-1 flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                                    {dayPosts.map((post: any) => {
                                        const isDraft = post.status === 'DRAFT';
                                        const isScheduled = post.status === 'SCHEDULED' || post.status === 'WAITING';
                                        const isPublished = post.status === 'PUBLISHED' || post.status === 'SENT';
                                        const isFailed = post.status === 'FAILED' || post.status === 'ERROR';

                                        // Status Border/BG configuration
                                        let cardClass = "border-white/10 bg-white/5 text-gray-300";
                                        let Icon = Clock;
                                        if (isDraft) {
                                            cardClass = "border-dashed border-gray-600 bg-gray-500/5 hover:border-gray-400 hover:bg-gray-500/10 text-gray-400";
                                        } else if (isScheduled) {
                                            cardClass = "border-blue-500/30 bg-blue-500/5 hover:border-blue-500 hover:bg-blue-500/10 text-blue-300";
                                            Icon = Clock;
                                        } else if (isPublished) {
                                            cardClass = "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-300";
                                            Icon = Check;
                                        } else if (isFailed) {
                                            cardClass = "border-red-500/30 bg-red-500/5 hover:border-red-500 hover:bg-red-500/10 text-red-400";
                                            Icon = AlertCircle;
                                        }

                                        // Get short caption snippet
                                        let label = post.content || "Sem título";
                                        try {
                                            if (post.content.trim().startsWith('{')) {
                                                const p = JSON.parse(post.content);
                                                label = p.caption || label;
                                            }
                                        } catch (e) {}

                                        const postTime = post.scheduledAt || post.publishedAt || post.createdAt;
                                        const timeStr = postTime ? new Date(postTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "";

                                        return (
                                            <div
                                                key={post.id}
                                                onClick={() => onEditPost(post)}
                                                className={`text-[9px] font-bold p-1 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-1 leading-tight ${cardClass}`}
                                                title={`[${post.status}] ${label}`}
                                            >
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <Icon size={10} className="shrink-0" />
                                                    <span className="truncate">{label}</span>
                                                </div>
                                                {timeStr && (
                                                    <span className="text-[8px] opacity-60 font-mono shrink-0">{timeStr}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* IA Best Times Indicator */}
                                {showBestTimes && cell.isCurrentMonth && (
                                    <div className="mt-1 pt-1 border-t border-emerald-500/10 flex flex-wrap gap-1">
                                        {bestTimes.map((time, tIdx) => (
                                            <button
                                                key={tIdx}
                                                onClick={() => onNavigateToCreate(`${isoDate}T${time}`)}
                                                className="text-[8px] font-bold px-1 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
                                                title={`Agendar para o melhor horário das ${time}`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Status Legend Footer */}
            <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-gray-500">
                <span className="font-bold">Legenda:</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-dashed border-gray-600 bg-gray-500/5"></span> Rascunho</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-blue-500/30 bg-blue-500/5"></span> Agendado</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-emerald-500/30 bg-emerald-500/5"></span> Publicado</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-red-500/30 bg-red-500/5"></span> Falha</span>
            </div>
        </div>
    );
}
