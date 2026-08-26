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
    Check,
    XCircle,
    DollarSign,
    CreditCard,
    QrCode,
    FileText,
    X
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
    
    // Modals & Action State
    const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<any | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<string[]>(['PIX']);

    const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState<string>('CLIENTE_AUSENTE');
    const [cancelNote, setCancelNote] = useState<string>('');
    const [submittingAction, setSubmittingAction] = useState(false);

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

    const togglePaymentMethod = (methodId: string) => {
        setPaymentMethods(prev => {
            if (prev.includes(methodId)) {
                if (prev.length === 1) return prev;
                return prev.filter(m => m !== methodId);
            } else {
                return [...prev, methodId];
            }
        });
    };

    // 4. Mark Delivery Completed with Selected Payment Tag(s)
    const handleConfirmDelivery = async () => {
        if (!token || !selectedOrderForDelivery) return;
        setSubmittingAction(true);
        
        try {
            const res = await fetch('/api/drivers/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    orderId: selectedOrderForDelivery.id,
                    action: 'complete',
                    paymentMethods
                })
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch (e) {
                data = { error: `Servidor indisponível (${res.status}). Tente novamente em instantes.` };
            }

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao finalizar entrega.');
            }

            toast.success('Entrega concluída com sucesso!');
            setSelectedOrderForDelivery(null);
            loadDriverData(token);
        } catch (err: any) {
            toast.error(err.message || 'Erro de conexão.');
        } finally {
            setSubmittingAction(false);
        }
    };

    // 5. Mark Delivery Cancelled/Returned with Reason
    const handleConfirmCancel = async () => {
        if (!token || !selectedOrderForCancel) return;
        setSubmittingAction(true);
        
        try {
            const res = await fetch('/api/drivers/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    orderId: selectedOrderForCancel.id,
                    action: 'cancel',
                    cancelReason,
                    cancelNote
                })
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch (e) {
                data = { error: `Servidor indisponível (${res.status}). Tente novamente em instantes.` };
            }

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao cancelar entrega.');
            }

            toast.success('Entrega devolvida/cancelada com sucesso.');
            setSelectedOrderForCancel(null);
            setCancelNote('');
            loadDriverData(token);
        } catch (err: any) {
            toast.error(err.message || 'Erro de conexão.');
        } finally {
            setSubmittingAction(false);
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
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between text-xs text-gray-300">
                                                    <span>{item.product?.name || 'Botijão de Gás'}</span>
                                                    <span className="font-semibold text-white">x{item.quantity}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center justify-between text-xs text-gray-300">
                                                <span>{(order as any).notes || (order as any).description || 'Botijão de Gás P13'}</span>
                                                <span className="font-semibold text-white">x1</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes / Observações */}
                                    {(order as any).notes && (
                                        <div className="flex items-start gap-2.5 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                                            <span className="text-amber-400 shrink-0 text-sm">📝</span>
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] text-amber-400 uppercase font-semibold">Observações</span>
                                                <p className="text-xs text-amber-200 leading-normal">{(order as any).notes}</p>
                                            </div>
                                        </div>
                                    )}

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
                                            onClick={() => {
                                                setSelectedOrderForDelivery(order);
                                                setPaymentMethods(['PIX']);
                                            }}
                                            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white text-xs font-semibold rounded-2xl flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)] border-0"
                                        >
                                            <Check className="h-4 w-4 text-white" /> Entregue
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            setSelectedOrderForCancel(order);
                                            setCancelReason('CLIENTE_AUSENTE');
                                            setCancelNote('');
                                        }}
                                        className="w-full p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 border border-red-500/20 transition"
                                    >
                                        <XCircle className="h-3.5 w-3.5" /> Devolver / Cancelar Entrega
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

            </main>

            {/* MODAL: ENTREGUE - SELEÇÃO DE PAGAMENTO */}
            {selectedOrderForDelivery && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0f0b29] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">Finalizar Entrega</h3>
                                    <p className="text-xs text-gray-400">Cliente: {selectedOrderForDelivery.contact?.name || 'Cliente'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedOrderForDelivery(null)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                    Forma(s) de Pagamento:
                                </label>
                                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    Pode selecionar mais de uma
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { id: 'PIX', label: 'PIX', icon: QrCode, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                                    { id: 'DINHEIRO', label: 'Dinheiro', icon: DollarSign, color: 'border-green-500/40 bg-green-500/10 text-green-300' },
                                    { id: 'CARTAO', label: 'Cartão', icon: CreditCard, color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' },
                                    { id: 'ANOTADO', label: 'Anotado (Fiado)', icon: FileText, color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
                                    { id: 'JA_PAGO', label: 'Já Pago (Online)', icon: CheckCircle2, color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
                                ].map((pm) => {
                                    const IconComponent = pm.icon;
                                    const isSelected = paymentMethods.includes(pm.id);
                                    return (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            onClick={() => togglePaymentMethod(pm.id)}
                                            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition active:scale-95 ${
                                                isSelected 
                                                    ? `${pm.color} ring-2 ring-emerald-500 shadow-lg` 
                                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="h-4 w-4 shrink-0" />
                                                <span>{pm.label}</span>
                                            </div>
                                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSelectedOrderForDelivery(null)}
                                className="w-1/3 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition border border-white/10"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelivery}
                                disabled={submittingAction}
                                className="w-2/3 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                <span>Confirmar Entrega</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CANCELAR / DEVOLVER ENTREGA */}
            {selectedOrderForCancel && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0f0b29] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">Devolver / Cancelar</h3>
                                    <p className="text-xs text-gray-400">Cliente: {selectedOrderForCancel.contact?.name || 'Cliente'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedOrderForCancel(null)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                                Motivo da devolução:
                            </label>

                            <div className="space-y-2">
                                {[
                                    { id: 'CLIENTE_AUSENTE', label: '🏠 Cliente Ausente / Não Atende' },
                                    { id: 'ENDERECO_NAO_ENCONTRADO', label: '📍 Endereço Não Encontrado' },
                                    { id: 'RECUSADO', label: '🚫 Recusado pelo Cliente' },
                                    { id: 'OUTRO', label: '📝 Outro Motivo' },
                                ].map((r) => {
                                    const isSelected = cancelReason === r.id;
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setCancelReason(r.id)}
                                            className={`w-full p-3 rounded-2xl border text-xs font-bold text-left transition active:scale-98 ${
                                                isSelected 
                                                    ? 'border-red-500/40 bg-red-500/10 text-red-300 ring-2 ring-red-500' 
                                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {cancelReason === 'OUTRO' && (
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        value={cancelNote}
                                        onChange={e => setCancelNote(e.target.value)}
                                        placeholder="Descreva o motivo (opcional)..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-red-500 transition"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSelectedOrderForCancel(null)}
                                className="w-1/3 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition border border-white/10"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={submittingAction}
                                className="w-2/3 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                <span>Confirmar Cancelamento</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
