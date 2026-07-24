'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    MapPin, 
    Navigation, 
    CheckCircle2, 
    AlertCircle, 
    Phone, 
    ShoppingBag, 
    Loader2,
    RefreshCw,
    UserCheck,
    Check
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { cleanAddress } from '@/lib/phone-utils';

function DriverDashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [token, setToken] = useState<string | null>(null);
    const [driver, setDriver] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // GPS Telemetry State
    const [gpsActive, setGpsActive] = useState(false);
    const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [syncingGps, setSyncingGps] = useState(false);

    // Auto-restore saved GPS preference on load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedGps = localStorage.getItem('driver_gps_active');
            if (savedGps === 'true') {
                setGpsActive(true);
            }
        }
    }, []);

    // 1. Token Initialization & Session Persistence
    useEffect(() => {
        const urlToken = searchParams.get('token');
        const savedToken = localStorage.getItem('driver_token');

        if (urlToken) {
            localStorage.setItem('driver_token', urlToken);
            setToken(urlToken);
            // Clean token from URL for security/cleanliness
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        } else if (savedToken) {
            setToken(savedToken);
        } else {
            setLoading(false);
            setError('Link de acesso inválido ou expirado. Por favor, solicite um novo link via WhatsApp.');
        }
    }, [searchParams]);

    // 2. Fetch Driver & Orders
    const loadDriverData = async (activeToken: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/drivers/me?token=${activeToken}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Erro ao carregar dados do entregador.');
            }
            const data = await res.json();
            setDriver(data.driver);
            setOrders(data.orders || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            localStorage.removeItem('driver_token');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadDriverData(token);
        }
    }, [token]);

    // 3. Geolocation Telemetry Watcher
    useEffect(() => {
        if (!token || !gpsActive) {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                setWatchId(null);
            }
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Seu aparelho não suporta Geolocalização.');
            setGpsActive(false);
            return;
        }

        const id = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentPos({ lat: latitude, lng: longitude });
                
                // Stream coordinates to API
                try {
                    setSyncingGps(true);
                    const response = await fetch('/api/drivers/telemetry', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token,
                            latitude,
                            longitude
                        })
                    });
                    if (response.ok) {
                        setLastSync(new Date());
                    }
                } catch (e) {
                    console.error('Failed to send GPS telemetry:', e);
                } finally {
                    setSyncingGps(false);
                }
            },
            (err) => {
                console.error('GPS Watch error:', err);
                if (err.message?.toLowerCase().includes('permissions policy') || err.message?.toLowerCase().includes('disabled')) {
                    toast.error('O navegador do WhatsApp bloqueou o GPS. Toque nos 3 pontos (⋮) no canto superior e escolha "Abrir no Chrome / Navegador".', { duration: 10000 });
                } else {
                    toast.error(`Erro no GPS: ${err.message}. Certifique-se de permitir a localização.`);
                }
                setGpsActive(false);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 15000
            }
        );

        setWatchId(id);

        return () => {
            if (id !== null) {
                navigator.geolocation.clearWatch(id);
            }
        };
    }, [gpsActive, token]);

    // Request GPS permission initially
    const toggleGps = () => {
        if (!gpsActive) {
            if (!navigator.geolocation) {
                toast.error('Seu aparelho não suporta Geolocalização.');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                () => {
                    setGpsActive(true);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('driver_gps_active', 'true');
                    }
                    toast.success('Rastreamento GPS ativado com sucesso!');
                },
                (err) => {
                    if (err.message?.toLowerCase().includes('permissions policy') || err.message?.toLowerCase().includes('disabled')) {
                        toast.error('O navegador do WhatsApp bloqueou o GPS. Toque nos 3 pontos (⋮) no canto superior e escolha "Abrir no Chrome / Navegador".', { duration: 10000 });
                    } else {
                        toast.error(`Permissão de GPS negada: ${err.message}`);
                    }
                }
            );
        } else {
            setGpsActive(false);
            if (typeof window !== 'undefined') {
                localStorage.setItem('driver_gps_active', 'false');
            }
            toast.info('Rastreamento GPS pausado.');
        }
    };

    // 4. Mark Delivery Completed
    const completeDelivery = async (orderId: string) => {
        if (!token) return;
        
        try {
            const res = await fetch('/api/drivers/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    orderId,
                    action: 'complete'
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao finalizar entrega.');
            }

            toast.success('Entrega concluída com sucesso!');
            // Reload data
            loadDriverData(token);
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6">
                <Loader2 className="h-10 w-10 animate-spin text-[#6366f1] mb-4" />
                <p className="text-gray-400 font-medium">Carregando painel do entregador...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-sm glass">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" /> Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030014] text-white font-sans pb-24">
            <Toaster theme="dark" position="top-center" />
            
            {/* Upper Premium Header */}
            <header className="sticky top-0 z-40 bg-slate-900/60 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-[#c084fc]" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold tracking-wide text-white">{driver?.name || 'Motorista'}</h1>
                        <span className="text-xs text-gray-400">{driver?.phone || 'WhatsApp'}</span>
                    </div>
                </div>
                
                <button 
                    onClick={() => token && loadDriverData(token)} 
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    title="Atualizar Pedidos"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </header>

            <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
                
                {/* Real-time GPS Telemetry Control */}
                <div className="glass rounded-3xl p-5 border border-white/5 relative overflow-hidden">
                    <div className="flex items-center justify-between z-10 relative">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold">Rastreamento de Rota</h2>
                            <p className="text-xs text-gray-400">
                                {gpsActive 
                                    ? (syncingGps ? 'Transmitindo localização...' : `Último sinal: ${lastSync ? lastSync.toLocaleTimeString() : 'Aguardando GPS'}`)
                                    : 'Ative para atualizar a distribuidora'
                                }
                            </p>
                        </div>
                        
                        <button 
                            onClick={toggleGps}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${gpsActive ? 'bg-green-500' : 'bg-slate-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${gpsActive ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Pulse status indicator */}
                    {gpsActive && (
                        <div className="absolute top-2 right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </div>
                    )}
                </div>

                {/* Delivery List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">Minhas Entregas ({orders.length})</h3>
                    
                    {orders.length === 0 ? (
                        <div className="glass rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-gray-500 mb-3" />
                            <p className="text-sm text-gray-400">Nenhuma entrega ativa atribuída.</p>
                            <p className="text-xs text-gray-600 mt-1">Quando um pedido for atribuído a você, ele aparecerá aqui.</p>
                        </div>
                    ) : (
                        orders.map((order) => {
                            const customer = order.contact || {};
                            const rawAddress = customer.notes || customer.needs || 'Endereço não informado';
                            const address = cleanAddress(rawAddress);
                            const clientPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
                            
                            return (
                                <div key={order.id} className="glass rounded-3xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition space-y-4">
                                    {/* Order Meta */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6366f1]/10 text-[#c084fc] border border-[#6366f1]/20">
                                                Pedido Gás
                                            </span>
                                            <h4 className="text-base font-semibold mt-2.5">{customer.name || 'Cliente'}</h4>
                                        </div>
                                        {clientPhone && (
                                            <a 
                                                href={`https://wa.me/${clientPhone}`} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition shadow-sm flex items-center justify-center"
                                                title="Conversar no WhatsApp com o Cliente"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>

                                    {/* Delivery Address */}
                                    <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <MapPin className="h-5 w-5 text-[#6366f1] shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Endereço de Entrega</span>
                                            <p className="text-xs text-gray-200 leading-normal">{address}</p>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-2">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Itens do Pedido</span>
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between text-xs text-gray-300">
                                                <span>{item.product?.name || 'Botijão de Gás'}</span>
                                                <span className="font-semibold text-white">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <a 
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-2xl flex items-center justify-center gap-1.5 border border-white/5 transition"
                                        >
                                            <Navigation className="h-3.5 w-3.5 text-[#c084fc]" /> Rota Maps
                                        </a>
                                        <button 
                                            onClick={() => completeDelivery(order.id)}
                                            className="p-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:opacity-90 text-white text-xs font-semibold rounded-2xl flex items-center justify-center gap-1.5 transition shadow-[0_0_10px_var(--primary-glow)] border-0"
                                        >
                                            <Check className="h-3.5 w-3.5 text-white" /> Entregue
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </main>
        </div>
    );
}

export default function DriverDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6">
                <Loader2 className="h-10 w-10 animate-spin text-[#6366f1] mb-4" />
                <p className="text-gray-400 font-medium">Carregando painel...</p>
            </div>
        }>
            <DriverDashboardContent />
        </Suspense>
    );
}
