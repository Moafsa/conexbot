"use client";

import { useState, useEffect } from "react";
import { 
    Calendar, 
    Clock, 
    Settings, 
    ExternalLink, 
    CheckCircle2, 
    XCircle, 
    Loader2,
    Save,
    CalendarDays
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
    contactName?: string;
    contactPhone?: string;
}

export function AgendaManager({ botId }: { botId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bot, setBot] = useState<any>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    // Config states
    const [provider, setProvider] = useState<'INTERNAL' | 'GOOGLE'>('INTERNAL');
    const [duration, setDuration] = useState(30);
    const [workingHours, setWorkingHours] = useState<any>({
        Mon: "09:00-18:00",
        Tue: "09:00-18:00",
        Wed: "09:00-18:00",
        Thu: "09:00-18:00",
        Fri: "09:00-18:00",
        Sat: "09:00-12:00",
        Sun: "Closed"
    });

    useEffect(() => {
        fetchData();
    }, [botId]);

    async function fetchData() {
        try {
            const res = await fetch(`/api/bots/${botId}`);
            if (res.ok) {
                const data = await res.json();
                setBot(data);
                setProvider(data.schedulingProvider || 'INTERNAL');
                setDuration(data.appointmentDuration || 30);
                if (data.workingHours) {
                    setWorkingHours(data.workingHours);
                }
            }

            const apptsRes = await fetch(`/api/bots/${botId}/appointments`);
            if (apptsRes.ok) {
                setAppointments(await apptsRes.json());
            }
        } catch (error) {
            console.error("Error fetching agenda data", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveConfig() {
        setSaving(true);
        try {
            const res = await fetch(`/api/bots/${botId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schedulingProvider: provider,
                    appointmentDuration: duration,
                    workingHours: workingHours
                })
            });

            if (res.ok) {
                alert("Configurações de agenda salvas!");
            } else {
                alert("Erro ao salvar.");
            }
        } catch (error) {
            console.error("Error saving config", error);
            alert("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Carregando agenda...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Configs */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500" />
                        Configurações
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Provedor de Agenda
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setProvider('INTERNAL')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                        provider === 'INTERNAL' 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    Agenda Interna
                                </button>
                                <button
                                    onClick={() => setProvider('GOOGLE')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                        provider === 'GOOGLE' 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    Google Calendar
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duração da Reunião (minutos)
                            </label>
                            <select 
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value={15}>15 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={45}>45 minutos</option>
                                <option value={60}>1 hora</option>
                                <option value={90}>1 hora e meia</option>
                                <option value={120}>2 horas</option>
                            </select>
                        </div>

                        {provider === 'GOOGLE' && (
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                                <p className="text-xs text-orange-800 flex items-center gap-2 mb-2">
                                    {bot?.googleRefreshToken 
                                        ? "Google Calendar Conectado" 
                                        : "Google Calendar não conectado"}
                                </p>
                                <button 
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`/api/bots/${botId}/google/auth`);
                                            const data = await res.json();
                                            if (data.url) {
                                                window.location.href = data.url;
                                            } else {
                                                alert(data.error || "Erro ao conectar conta Google.");
                                            }
                                        } catch(e) {
                                            alert("Erro ao iniciar autorização.");
                                        }
                                    }}
                                    className="w-full py-2 bg-white hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-lg text-xs font-bold transition-colors"
                                >
                                    {bot?.googleRefreshToken ? "Reconectar Conta Google" : "Conectar Conta Google"}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Horário de Trabalho
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(workingHours).map(([day, hours]: any) => (
                            <div key={day} className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 font-medium">{day}</span>
                                <input 
                                    type="text"
                                    value={hours}
                                    onChange={(e) => setWorkingHours({...workingHours, [day]: e.target.value})}
                                    className="w-32 py-1 px-2 border-gray-300 bg-white text-gray-900 rounded text-right focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Appointments */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            Próximos Agendamentos
                        </h3>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-semibold">
                            {appointments.length} Total
                        </span>
                    </div>

                    {appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
                            <p>Nenhum compromisso marcado ainda.</p>
                            <p className="text-xs">Peça ao bot no simulador para agendar uma reunião para testar!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((appt) => (
                                <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all group">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-600">
                                            <span className="text-[10px] font-bold uppercase">{format(new Date(appt.startTime), 'MMM', { locale: ptBR })}</span>
                                            <span className="text-lg font-bold leading-none">{format(new Date(appt.startTime), 'dd')}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{appt.contactName || "Cliente Conectado"}</h4>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                            appt.status === 'CONFIRMED' ? 'bg-green-50 text-green-600' :
                                            appt.status === 'CANCELED' ? 'bg-red-50 text-red-600' :
                                            'bg-yellow-50 text-yellow-600'
                                        }`}>
                                            {appt.status}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 hover:bg-green-50 text-green-600 rounded" title="Confirmar">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 hover:bg-red-50 text-red-600 rounded" title="Cancelar">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
