'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Truck, RefreshCw, Eye, EyeOff, User, Compass } from 'lucide-react';
import { toast } from 'sonner';

interface DriverMapProps {
    mapboxToken: string;
}

export default function DriverMap({ mapboxToken }: DriverMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const orderMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [showInactive, setShowInactive] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 1. Fetch Drivers & Deliveries Data
    const fetchDrivers = async () => {
        try {
            setIsRefreshing(true);
            const res = await fetch('/api/drivers');
            if (!res.ok) throw new Error('Falha ao buscar motoristas');
            const data = await res.json();
            setDrivers(data || []);
        } catch (e: any) {
            console.error('Error fetching drivers:', e);
            toast.error('Erro ao atualizar rastreamento de motoristas');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
        const interval = setInterval(fetchDrivers, 12000); // refresh every 12 seconds
        return () => clearInterval(interval);
    }, []);

    // 2. Initialize Mapbox Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !mapboxToken) return;

        mapboxgl.accessToken = mapboxToken;
        
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-46.633308, -23.55052], // Default to São Paulo center
            zoom: 11,
            pitch: 30, // 3D look
            bearing: -10
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapRef.current = map;

        map.on('load', () => {
            // Force resize trigger
            map.resize();
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapboxToken]);

    // 3. Update Markers & Map bounds
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear existing markers that are no longer present
        const driverIds = new Set(drivers.map(d => d.id));
        Object.keys(markersRef.current).forEach(id => {
            if (!driverIds.has(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Track active order marker IDs to clear old ones
        const activeOrderIds = new Set<string>();

        // Center map bounding box around active drivers
        const bounds = new mapboxgl.LngLatBounds();
        let hasCoords = false;

        drivers.forEach((driver) => {
            const hasGps = driver.latitude !== null && driver.longitude !== null;
            const isOnline = driver.lastActive && (new Date().getTime() - new Date(driver.lastActive).getTime() < 300000); // 5 min

            if (!hasGps) return;
            if (!showInactive && !isOnline) {
                // Remove marker if filter is off
                if (markersRef.current[driver.id]) {
                    markersRef.current[driver.id].remove();
                    delete markersRef.current[driver.id];
                }
                return;
            }

            const driverLngLat: [number, number] = [driver.longitude, driver.latitude];
            bounds.extend(driverLngLat);
            hasCoords = true;

            // --- A. Render/Update Driver Marker ---
            if (markersRef.current[driver.id]) {
                // Update position
                markersRef.current[driver.id].setLngLat(driverLngLat);
            } else {
                // Create custom element
                const el = document.createElement('div');
                el.className = 'relative flex items-center justify-center cursor-pointer';
                el.style.width = '42px';
                el.style.height = '42px';
                
                el.innerHTML = `
                    <div class="absolute inset-0 rounded-full bg-[#6366f1] opacity-25 animate-ping"></div>
                    <div class="relative h-9 w-9 rounded-full bg-slate-900 border-2 border-[#6366f1] flex items-center justify-center shadow-lg">
                        <span class="text-[10px] font-bold text-[#c084fc]">${driver.name ? driver.name.substring(0,2).toUpperCase() : 'DR'}</span>
                    </div>
                    <div class="absolute -bottom-1 h-3 w-3 rounded-full border border-slate-900 ${isOnline ? 'bg-green-500' : 'bg-amber-500'}"></div>
                `;

                // Add Popup
                const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <div class="p-2 text-slate-800 font-sans">
                        <h4 class="font-bold text-sm text-indigo-700">${driver.name || 'Entregador'}</h4>
                        <p class="text-xs text-slate-500 mt-0.5">WhatsApp: ${driver.phone}</p>
                        <p class="text-xs font-semibold mt-1.5">Entregas Ativas: ${driver.assignedOrders?.length || 0}</p>
                    </div>
                `);

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat(driverLngLat)
                    .setPopup(popup)
                    .addTo(map);

                // Add click listener
                el.addEventListener('click', () => {
                    setSelectedDriver(driver);
                });

                markersRef.current[driver.id] = marker;
            }

            // --- B. Render/Update Client Order Markers ---
            driver.assignedOrders?.forEach((order: any) => {
                const customer = order.contact;
                if (!customer) return;

                // Try to draw coordinates for client. If not present, we skip.
                // In a production app, we would Geocode customer notes/address to get lat/lng.
                // For this tracking view, we simulate client coordinates near the driver or use standard geocoding.
                // Let's assume order can have latitude/longitude in the contact, or simulate a offset.
                const clientLat = customer.latitude || (driver.latitude + 0.005);
                const clientLng = customer.longitude || (driver.longitude - 0.005);
                const orderLngLat: [number, number] = [clientLng, clientLat];
                activeOrderIds.add(order.id);

                if (orderMarkersRef.current[order.id]) {
                    orderMarkersRef.current[order.id].setLngLat(orderLngLat);
                } else {
                    const el = document.createElement('div');
                    el.className = 'cursor-pointer';
                    el.innerHTML = `
                        <div class="h-8 w-8 rounded-full bg-slate-900 border border-rose-500 flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                    `;

                    const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
                        <div class="p-2 text-slate-800 font-sans max-w-xs">
                            <span class="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">ENTREGA DE GÁS</span>
                            <h4 class="font-bold text-sm mt-1 text-slate-800">${customer.name || 'Cliente'}</h4>
                            <p class="text-[11px] text-slate-500 mt-1"><b>Endereço:</b> ${customer.notes || customer.needs || 'Não especificado'}</p>
                            <p class="text-xs text-slate-700 mt-1 font-semibold">Itens: ${order.items?.map((i: any) => `${i.product.name} x${i.quantity}`).join(', ')}</p>
                        </div>
                    `);

                    const marker = new mapboxgl.Marker({ element: el })
                        .setLngLat(orderLngLat)
                        .setPopup(popup)
                        .addTo(map);

                    orderMarkersRef.current[order.id] = marker;
                }
            });
        });

        // Clear order markers that are no longer active
        Object.keys(orderMarkersRef.current).forEach(id => {
            if (!activeOrderIds.has(id)) {
                orderMarkersRef.current[id].remove();
                delete orderMarkersRef.current[id];
            }
        });

        // Fit map bounds to show all markers (only run once or when bounds change drastically)
        if (hasCoords && map && !selectedDriver) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1500 });
        }
    }, [drivers, showInactive]);

    // Pan map to selected driver
    const handleFlyToDriver = (driver: any) => {
        setSelectedDriver(driver);
        if (mapRef.current && driver.latitude && driver.longitude) {
            mapRef.current.flyTo({
                center: [driver.longitude, driver.latitude],
                zoom: 14,
                pitch: 45,
                duration: 2000
            });
        }
    };

    return (
        <div className="flex h-[calc(100vh-68px)] overflow-hidden bg-[#030014] text-white">
            
            {/* Sidebar Control Panel */}
            <div className="w-80 border-r border-white/5 bg-[#07041a]/60 backdrop-blur-md flex flex-col justify-between custom-scrollbar-white overflow-y-auto">
                <div className="p-5 space-y-5">
                    
                    {/* Title & Refresh */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Rastreamento de Frota</h2>
                            <p className="text-xs text-gray-400">Posição dos entregadores em tempo real</p>
                        </div>
                        <button 
                            onClick={fetchDrivers} 
                            disabled={isRefreshing}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-gray-300 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Filter Switches */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-sm">
                        <span className="text-gray-300 font-medium">Mostrar Inativos</span>
                        <button 
                            onClick={() => setShowInactive(!showInactive)}
                            className="text-indigo-400 hover:text-indigo-300 transition"
                        >
                            {showInactive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5 text-gray-500" />}
                        </button>
                    </div>

                    {/* Drivers List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Entregadores ({drivers.length})</h3>
                        
                        {loading ? (
                            <div className="py-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                                <span className="text-xs">Carregando entregadores...</span>
                            </div>
                        ) : drivers.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 text-xs border border-dashed border-white/10 rounded-2xl">
                                Nenhum entregador cadastrado
                            </div>
                        ) : (
                            drivers.map((driver) => {
                                const isOnline = driver.lastActive && (new Date().getTime() - new Date(driver.lastActive).getTime() < 300000);
                                const hasGps = driver.latitude !== null && driver.longitude !== null;
                                const isSelected = selectedDriver?.id === driver.id;

                                return (
                                    <div 
                                        key={driver.id}
                                        onClick={() => handleFlyToDriver(driver)}
                                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                                            isSelected 
                                                ? 'bg-indigo-600/20 border-indigo-500/50' 
                                                : 'bg-white/5 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                                    <Truck className="h-4 w-4 text-indigo-400" />
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-slate-950 ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white">{driver.name || 'Sem nome'}</h4>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {hasGps ? `${driver.latitude.toFixed(4)}, ${driver.longitude.toFixed(4)}` : 'Sem sinal GPS'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                            {driver.assignedOrders?.length || 0} jobs
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Selected Driver Details */}
                {selectedDriver && (
                    <div className="p-5 border-t border-white/5 bg-slate-950/80">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entregas do Motorista</h3>
                        <h4 className="text-base font-bold text-white mt-1">{selectedDriver.name}</h4>
                        
                        <div className="mt-3.5 space-y-3">
                            {selectedDriver.assignedOrders?.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Sem entregas ativas no momento.</p>
                            ) : (
                                selectedDriver.assignedOrders?.map((order: any) => (
                                    <div key={order.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-indigo-300">#{order.id.substring(0, 6)}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-semibold">
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-300"><b>Cliente:</b> {order.contact?.name || 'Cliente'}</p>
                                        <p className="text-gray-400 line-clamp-2"><b>Endereço:</b> {order.contact?.notes || order.contact?.needs || 'Não informado'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="flex-1 relative h-full w-full">
                {!mapboxToken && (
                    <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-center p-6">
                        <MapPin className="h-12 w-12 text-indigo-500 mb-4 animate-bounce" />
                        <h3 className="text-lg font-bold">Mapbox Token Não Configurado</h3>
                        <p className="text-gray-400 max-w-sm text-sm mt-2">
                            Configure seu Mapbox Access Token nas configurações do Bot ou CRM para visualizar o rastreamento em tempo real.
                        </p>
                    </div>
                )}
                <div ref={mapContainerRef} className="h-full w-full" />
            </div>

        </div>
    );
}
