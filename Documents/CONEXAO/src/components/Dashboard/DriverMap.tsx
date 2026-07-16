'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Truck, RefreshCw, Eye, EyeOff, User, Compass, Edit2, Settings, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DriverMapProps {
    mapboxToken: string;
}

export default function DriverMap({ mapboxToken }: DriverMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const orderMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const geocodedOrdersRef = useRef<{ [key: string]: [number, number] }>({});
    
    const [drivers, setDrivers] = useState<any[]>([]);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [showInactive, setShowInactive] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Driver Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [driverId, setDriverId] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [driverKeywords, setDriverKeywords] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Delivery Fees Modal State
    const [feesModalOpen, setFeesModalOpen] = useState(false);
    const [deliveryFeeType, setDeliveryFeeType] = useState('FIXED');
    const [deliveryFeeRules, setDeliveryFeeRules] = useState<any[]>([]);
    const [savingFees, setSavingFees] = useState(false);

    // Responsive UI state
    const [activeView, setActiveView] = useState<'map' | 'orders' | 'drivers'>('map');

    // 1. Fetch Drivers Data
    const fetchDrivers = async () => {
        try {
            const res = await fetch('/api/drivers');
            if (!res.ok) throw new Error('Falha ao buscar motoristas');
            const data = await res.json();
            setDrivers(data || []);
        } catch (e: any) {
            console.error('Error fetching drivers:', e);
            toast.error('Erro ao atualizar rastreamento de motoristas');
        }
    };

    // 2. Fetch Pending Orders Data
    const fetchPendingOrders = async () => {
        try {
            const res = await fetch('/api/drivers/pending-orders', { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao buscar pedidos pendentes');
            const data = await res.json();
            setPendingOrders(data || []);
        } catch (e: any) {
            console.error('Error fetching pending orders:', e);
        }
    };

    // Reload both datasets
    const refreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchDrivers(), fetchPendingOrders()]);
        setLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        refreshAll();
        const interval = setInterval(refreshAll, 12000); // refresh every 12 seconds
        return () => clearInterval(interval);
    }, []);

    // Trigger map resize when switching to map view on mobile
    useEffect(() => {
        if (activeView === 'map' && mapRef.current) {
            setTimeout(() => {
                mapRef.current?.resize();
            }, 100);
        }
    }, [activeView]);

    // 3. Initialize Mapbox Map
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
            map.resize();
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapboxToken]);

    // Center map on configured city on load
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapboxToken) return;

        const centerOnConfiguredCity = async () => {
            try {
                const res = await fetch('/api/drivers/fees');
                if (res.ok) {
                    const data = await res.json();
                    const rules = data.deliveryFeeRules || [];
                    const firstRule = rules.find((r: any) => r.city || r.cidade);
                    const cityName = firstRule ? (firstRule.city || firstRule.cidade) : null;

                    if (cityName) {
                        const geocodeRes = await fetch(
                            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${mapboxToken}&limit=1`
                        );
                        if (geocodeRes.ok) {
                            const geocodeData = await geocodeRes.json();
                            const center = geocodeData.features?.[0]?.center;
                            if (center) {
                                map.setCenter(center);
                                map.setZoom(12);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error geocoding configured city:", err);
            }
        };

        if (map.loaded()) {
            centerOnConfiguredCity();
        } else {
            map.once('load', centerOnConfiguredCity);
        }
    }, [mapboxToken, mapRef.current]);

    // 4. Update Markers & Map bounds
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

        const activeOrderIds = new Set<string>();
        const bounds = new mapboxgl.LngLatBounds();
        let hasCoords = false;

        drivers.forEach((driver) => {
            const hasGps = driver.latitude !== null && driver.longitude !== null;
            const isOnline = driver.lastActive && (new Date().getTime() - new Date(driver.lastActive).getTime() < 300000); // 5 min

            if (!hasGps) return;
            if (!showInactive && !isOnline) {
                if (markersRef.current[driver.id]) {
                    markersRef.current[driver.id].remove();
                    delete markersRef.current[driver.id];
                }
                return;
            }

            const driverLngLat: [number, number] = [driver.longitude, driver.latitude];
            bounds.extend(driverLngLat);
            hasCoords = true;

            // Render/Update Driver Marker
            if (markersRef.current[driver.id]) {
                markersRef.current[driver.id].setLngLat(driverLngLat);
            } else {
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

                el.addEventListener('click', () => {
                    setSelectedDriver(driver);
                });

                markersRef.current[driver.id] = marker;
            }

            // Render/Update Client Order Markers
            driver.assignedOrders?.forEach((order: any) => {
                const customer = order.contact;
                if (!customer) return;

                const orderId = order.id;

                const renderMarker = (lng: number, lat: number) => {
                    const orderLngLat: [number, number] = [lng, lat];
                    activeOrderIds.add(orderId);
                    bounds.extend(orderLngLat);
                    hasCoords = true;

                    if (orderMarkersRef.current[orderId]) {
                        orderMarkersRef.current[orderId].setLngLat(orderLngLat);
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

                        orderMarkersRef.current[orderId] = marker;
                    }
                };

                let clientLat = customer.latitude;
                let clientLng = customer.longitude;

                if (clientLng && clientLat) {
                    renderMarker(clientLng, clientLat);
                } else if (geocodedOrdersRef.current[orderId]) {
                    const [lng, lat] = geocodedOrdersRef.current[orderId];
                    renderMarker(lng, lat);
                } else {
                    const rawAddr = customer.needs || customer.notes || '';
                    const cleanAddr = rawAddr.split('\n')[0].replace('Endereço: ', '').trim();
                    if (cleanAddr && mapboxToken) {
                        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanAddr)}.json?access_token=${mapboxToken}&limit=1`)
                            .then(r => r.json())
                            .then(data => {
                                const center = data.features?.[0]?.center;
                                if (center) {
                                    geocodedOrdersRef.current[orderId] = center;
                                    renderMarker(center[0], center[1]);
                                } else {
                                    const fallbackLng = driver.longitude - 0.005;
                                    const fallbackLat = driver.latitude + 0.005;
                                    geocodedOrdersRef.current[orderId] = [fallbackLng, fallbackLat];
                                    renderMarker(fallbackLng, fallbackLat);
                                }
                            })
                            .catch(err => {
                                console.error("Error geocoding assigned order:", err);
                                const fallbackLng = driver.longitude - 0.005;
                                const fallbackLat = driver.latitude + 0.005;
                                renderMarker(fallbackLng, fallbackLat);
                            });
                    } else {
                        const fallbackLng = driver.longitude - 0.005;
                        const fallbackLat = driver.latitude + 0.005;
                        renderMarker(fallbackLng, fallbackLat);
                    }
                }
            });
        });

        // Render/Update Pending (Unassigned) Client Order Markers
        pendingOrders.forEach((order: any) => {
            const customer = order.contact;
            if (!customer) return;

            const orderId = order.id;

            const renderMarker = (lng: number, lat: number) => {
                const orderLngLat: [number, number] = [lng, lat];
                activeOrderIds.add(orderId);
                bounds.extend(orderLngLat);
                hasCoords = true;

                if (orderMarkersRef.current[orderId]) {
                    orderMarkersRef.current[orderId].setLngLat(orderLngLat);
                } else {
                    const el = document.createElement('div');
                    el.className = 'cursor-pointer';
                    el.innerHTML = `
                        <div class="h-8 w-8 rounded-full bg-slate-900 border border-amber-500 flex items-center justify-center shadow-lg animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                    `;

                    const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
                        <div class="p-2 text-slate-800 font-sans max-w-xs">
                            <span class="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold animate-pulse">AGUARDANDO ENTREGADOR</span>
                            <h4 class="font-bold text-sm mt-1 text-slate-800">${customer.name || 'Cliente'}</h4>
                            <p class="text-[11px] text-slate-500 mt-1"><b>Endereço:</b> ${customer.notes || customer.needs || 'Não especificado'}</p>
                            <p class="text-xs text-slate-700 mt-1 font-semibold">Itens: ${order.items?.map((i: any) => `${i.product.name} x${i.quantity}`).join(', ')}</p>
                        </div>
                    `);

                    const marker = new mapboxgl.Marker({ element: el })
                        .setLngLat(orderLngLat)
                        .setPopup(popup)
                        .addTo(map);

                    orderMarkersRef.current[orderId] = marker;
                }
            };

            let clientLat = customer.latitude;
            let clientLng = customer.longitude;

            if (clientLng && clientLat) {
                renderMarker(clientLng, clientLat);
            } else if (geocodedOrdersRef.current[orderId]) {
                const [lng, lat] = geocodedOrdersRef.current[orderId];
                renderMarker(lng, lat);
            } else {
                const rawAddr = customer.needs || customer.notes || '';
                const cleanAddr = rawAddr.split('\n')[0].replace('Endereço: ', '').trim();
                if (cleanAddr && mapboxToken) {
                    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanAddr)}.json?access_token=${mapboxToken}&limit=1`)
                        .then(r => r.json())
                        .then(data => {
                            const center = data.features?.[0]?.center;
                            if (center) {
                                geocodedOrdersRef.current[orderId] = center;
                                renderMarker(center[0], center[1]);
                            }
                        })
                        .catch(err => console.error("Error geocoding pending order:", err));
                }
            }
        });

        Object.keys(orderMarkersRef.current).forEach(id => {
            if (!activeOrderIds.has(id)) {
                orderMarkersRef.current[id].remove();
                delete orderMarkersRef.current[id];
            }
        });

        if (hasCoords && map && !selectedDriver) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1500 });
        }
    }, [drivers, showInactive, pendingOrders]);

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

    // Drag & Drop event handlers
    const handleDragStart = (e: React.DragEvent, orderId: string) => {
        e.dataTransfer.setData('orderId', orderId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleAssignOrder = async (orderId: string, driverId: string) => {
        if (!orderId || !driverId) return;

        try {
            toast.loading('Despachando entrega...', { id: 'dispatch' });
            const res = await fetch('/api/drivers/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, driverId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao despachar pedido');
            }

            toast.success('Pedido despachado e motorista notificado!', { id: 'dispatch' });
            refreshAll();
        } catch (err: any) {
            toast.error(err.message, { id: 'dispatch' });
        }
    };

    const handleDrop = async (e: React.DragEvent, driverId: string) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('orderId');
        handleAssignOrder(orderId, driverId);
    };

    // Open Modal for Create or Edit Entregador
    const handleOpenModal = (driverToEdit?: any) => {
        if (driverToEdit) {
            setModalMode('edit');
            setDriverId(driverToEdit.id);
            setDriverName(driverToEdit.name || '');
            setDriverPhone(driverToEdit.phone || '');
            setDriverKeywords(driverToEdit.dispatchKeywords || '');
        } else {
            setModalMode('create');
            setDriverId('');
            setDriverName('');
            setDriverPhone('');
            setDriverKeywords('');
        }
        setModalOpen(true);
    };

    // Open Delivery Fees configuration modal
    const handleOpenFeesModal = async () => {
        try {
            toast.loading('Carregando regras de entrega...', { id: 'fees' });
            const res = await fetch('/api/drivers/fees');
            if (res.ok) {
                const data = await res.json();
                setDeliveryFeeType(data.deliveryFeeType || 'FIXED');
                setDeliveryFeeRules(Array.isArray(data.deliveryFeeRules) ? data.deliveryFeeRules : []);
                toast.dismiss('fees');
            } else {
                throw new Error('Falha ao carregar taxas');
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao buscar taxas de entrega', { id: 'fees' });
        }
        setFeesModalOpen(true);
    };

    const handleAddRule = () => {
        setDeliveryFeeRules([
            ...deliveryFeeRules,
            { city: '', neighborhood: '', fee: 0 }
        ]);
    };

    const handleRemoveRule = (index: number) => {
        setDeliveryFeeRules(deliveryFeeRules.filter((_, i) => i !== index));
    };

    const handleRuleChange = (index: number, field: string, value: any) => {
        const updated = [...deliveryFeeRules];
        updated[index] = {
            ...updated[index],
            [field]: value
        };
        setDeliveryFeeRules(updated);
    };

    // Save Delivery Fees
    const handleSaveFees = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingFees(true);
            const res = await fetch('/api/drivers/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deliveryFeeType,
                    deliveryFeeRules
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Erro ao salvar taxas de entrega');
            }

            toast.success('Configurações de entrega salvas com sucesso!');
            setFeesModalOpen(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSavingFees(false);
        }
    };

    // Save Driver handler
    const handleSaveDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverName || !driverPhone) {
            toast.error('Nome e telefone são obrigatórios');
            return;
        }

        try {
            setSubmitting(true);
            const method = modalMode === 'create' ? 'POST' : 'PUT';
            const res = await fetch('/api/drivers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: driverId || undefined,
                    name: driverName,
                    phone: driverPhone,
                    dispatchKeywords: driverKeywords
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Erro ao salvar entregador');
            }

            toast.success(modalMode === 'create' ? 'Entregador cadastrado com sucesso!' : 'Cadastro atualizado!');
            setModalOpen(false);
            refreshAll();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Send magic login link via WhatsApp
    const handleSendAppLink = async (driverId: string, driverName: string) => {
        toast.loading(`Enviando app para ${driverName}...`, { id: 'send-app' });
        try {
            const res = await fetch('/api/drivers/send-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao enviar link do aplicativo.');
            }

            toast.success(`Link do app enviado para ${driverName} via WhatsApp!`, { id: 'send-app' });
        } catch (err: any) {
            toast.error(err.message, { id: 'send-app' });
        }
    };

    // Delete driver contact
    const handleDeleteDriver = async (driverId: string, driverName: string) => {
        if (!confirm(`Tem certeza que deseja excluir o entregador ${driverName}?`)) return;
        toast.loading(`Excluindo entregador ${driverName}...`, { id: 'delete-driver' });
        try {
            const res = await fetch(`/api/drivers?id=${driverId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao excluir entregador.');
            }

            toast.success(`Entregador ${driverName} excluído com sucesso!`, { id: 'delete-driver' });
            // Refresh list
            refreshAll();
        } catch (err: any) {
            toast.error(err.message, { id: 'delete-driver' });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-68px)] overflow-hidden bg-[#030014] text-white">
            
            {/* Mobile View Tabs Header */}
            <div className="flex lg:hidden bg-[#07041a] border-b border-white/5 p-2.5 shrink-0 justify-around gap-2 z-10">
                <button 
                    onClick={() => setActiveView('orders')}
                    className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                        activeView === 'orders' 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                            : 'bg-white/5 border-white/5 text-gray-400'
                    }`}
                >
                    Pedidos ({pendingOrders.length})
                </button>
                <button 
                    onClick={() => setActiveView('drivers')}
                    className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                        activeView === 'drivers' 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                            : 'bg-white/5 border-white/5 text-gray-400'
                    }`}
                >
                    Entregadores ({drivers.length})
                </button>
                <button 
                    onClick={() => setActiveView('map')}
                    className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                        activeView === 'map' 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                            : 'bg-white/5 border-white/5 text-gray-400'
                    }`}
                >
                    Mapa
                </button>
            </div>
            
            {/* Column 1: Pending Orders (Drag Source) */}
            <div className={`${
                activeView === 'orders' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-80 border-r border-white/5 bg-[#07041a]/60 backdrop-blur-md flex-col custom-scrollbar-white overflow-y-auto shrink-0 h-full`}>
                <div className="p-5 space-y-4">
                    <div>
                        <h2 className="text-xs font-bold tracking-wider uppercase text-gray-400">Pedidos Pendentes ({pendingOrders.length})</h2>
                        <p className="text-[10px] text-gray-500 mt-1">Arraste um cartão e solte-o em um motorista</p>
                    </div>

                    <div className="space-y-3">
                        {pendingOrders.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 text-xs border border-dashed border-white/10 rounded-2xl p-4">
                                Nenhum pedido pronto para entrega no momento
                            </div>
                        ) : (
                            pendingOrders.map((order) => {
                                const customer = order.contact || {};
                                const address = customer.notes || customer.needs || 'Endereço não cadastrado';
                                
                                return (
                                    <div 
                                        key={order.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, order.id)}
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition cursor-grab active:cursor-grabbing space-y-2 relative overflow-hidden group/order"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#ec4899]"></div>
                                        <div className="pl-1.5 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-[#ec4899] bg-[#ec4899]/10 px-2 py-0.5 rounded-full">
                                                    #{order.id.substring(0, 6)}
                                                </span>
                                                <span className="text-[9px] text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-white truncate">{customer.name || 'Cliente'}</h4>
                                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                                                📍 {address}
                                            </p>
                                            <div className="text-[9px] text-[#c084fc] font-medium pt-1 border-t border-white/5">
                                                {order.items?.map((i: any) => `${i.product?.name || 'Botijão'} x${i.quantity}`).join(', ')}
                                            </div>
                                            {/* Mobile dispatch selection */}
                                            {drivers.length > 0 && (
                                                <div className="lg:hidden mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
                                                    <span className="text-[8px] text-gray-500 font-semibold">Despachar para:</span>
                                                    <select
                                                        onChange={(e) => {
                                                            const dId = e.target.value;
                                                            if (dId) {
                                                                handleAssignOrder(order.id, dId);
                                                            }
                                                            e.target.value = "";
                                                        }}
                                                        className="bg-[#0f0b29] border border-white/10 rounded-lg text-[10px] text-gray-300 p-1 outline-none w-full"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Escolha o Entregador</option>
                                                        {drivers.map(d => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Column 2: Drivers (Drop Target) */}
            <div className={`${
                activeView === 'drivers' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-80 border-r border-white/5 bg-[#07041a]/40 backdrop-blur-md flex-col justify-between custom-scrollbar-white overflow-y-auto shrink-0 h-full`}>
                <div className="p-5 space-y-5">
                    
                    {/* Title & Refresh */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold tracking-wider uppercase text-gray-400">Entregadores ({drivers.length})</h2>
                            <p className="text-[10px] text-gray-500 mt-1">Arraste os pedidos para estas caixas</p>
                        </div>
                        <button 
                            onClick={refreshAll} 
                            disabled={isRefreshing}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-gray-300 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Actions Panel */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => handleOpenModal()} 
                                className="p-2.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:opacity-90 text-white text-[11px] font-semibold rounded-2xl flex items-center justify-center gap-1 transition shadow-[0_0_10px_var(--primary-glow)] border-0 cursor-pointer text-center"
                            >
                                + Entregador
                            </button>
                            <button 
                                onClick={handleOpenFeesModal} 
                                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-semibold rounded-2xl flex items-center justify-center gap-1 transition cursor-pointer text-center"
                            >
                                ⚙️ Taxas
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5 text-xs">
                            <span className="text-gray-300 font-medium">Mostrar Inativos</span>
                            <button 
                                onClick={() => setShowInactive(!showInactive)}
                                className="text-indigo-400 hover:text-indigo-300 transition"
                            >
                                {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
                            </button>
                        </div>
                    </div>

                    {/* Drivers List */}
                    <div className="space-y-3">
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
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, driver.id)}
                                        className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 group/item ${
                                            isSelected 
                                                ? 'bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                                : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                                        } relative overflow-hidden`}
                                    >
                                        {/* Drop overlay helper */}
                                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/item:opacity-100 border-2 border-dashed border-indigo-500/40 rounded-2xl pointer-events-none transition"></div>

                                        <div className="flex items-center justify-between cursor-pointer" onClick={() => handleFlyToDriver(driver)}>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="h-9 w-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                                                        <Truck className="h-4 w-4 text-indigo-400" />
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-slate-950 ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-semibold text-white">{driver.name || 'Sem nome'}</h4>
                                                    <p className="text-[9px] text-gray-400 mt-0.5">
                                                        {hasGps ? `${driver.latitude.toFixed(4)}, ${driver.longitude.toFixed(4)}` : 'Sem sinal GPS'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                {driver.assignedOrders?.length || 0} jobs
                                            </span>
                                        </div>

                                        {/* Coverage keywords and edit button */}
                                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-gray-400">
                                            <span className="truncate max-w-[100px]" title={driver.dispatchKeywords || 'Nenhum'}>
                                                <b>Região:</b> {driver.dispatchKeywords || 'Nenhum'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSendAppLink(driver.id, driver.name);
                                                    }}
                                                    className="text-emerald-400 hover:text-emerald-300 transition font-semibold flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                                >
                                                    <Smartphone className="h-2.5 w-2.5" /> Enviar App
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenModal(driver);
                                                    }}
                                                    className="text-indigo-400 hover:text-indigo-300 transition font-semibold flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                                >
                                                    <Edit2 className="h-2 w-2" /> Editar
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteDriver(driver.id, driver.name);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 transition font-semibold flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                                                >
                                                    <Trash2 className="h-2.5 w-2.5" /> Excluir
                                                </button>
                                            </div>
                                        </div>
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
                        <h4 className="text-sm font-bold text-white mt-1">{selectedDriver.name}</h4>
                        
                        <div className="mt-3 space-y-2.5">
                            {selectedDriver.assignedOrders?.length === 0 ? (
                                <p className="text-[11px] text-gray-400 italic">Sem entregas ativas no momento.</p>
                            ) : (
                                selectedDriver.assignedOrders?.map((order: any) => (
                                    <div key={order.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] space-y-1.5 relative">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-indigo-300">#{order.id.substring(0, 6)}</span>
                                            <span className="text-[8px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-semibold">
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

            {/* Column 3: Mapbox Map */}
            <div className={`${
                activeView === 'map' ? 'flex' : 'hidden'
            } lg:flex flex-1 relative h-full w-full`}>
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

            {/* Modal de Cadastro/Edição de Entregador */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-[#07041a] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in text-white">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h3 className="text-base font-bold text-white">
                                {modalMode === 'create' ? 'Cadastrar Novo Entregador' : 'Editar Entregador'}
                            </h3>
                            <button 
                                onClick={() => setModalOpen(false)} 
                                className="text-gray-400 hover:text-white transition text-lg bg-transparent border-0 cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveDriver} className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Nome</label>
                                <input 
                                    type="text" 
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    placeholder="Ex: Carlos Silva"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">WhatsApp (Apenas Números)</label>
                                <input 
                                    type="text" 
                                    value={driverPhone}
                                    onChange={(e) => setDriverPhone(e.target.value)}
                                    placeholder="Ex: 5551999998888"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Bairros / Cidades Atendidos</label>
                                <textarea 
                                    value={driverKeywords}
                                    onChange={(e) => setDriverKeywords(e.target.value)}
                                    placeholder="Ex: Centro, Vila Nova, Jardim América (separados por vírgula)"
                                    rows={3}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                                />
                                <span className="text-[10px] text-gray-500 leading-normal block">
                                    O bot usará estes nomes de bairros ou cidades para encontrar automaticamente este motorista ao receber pedidos.
                                </span>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 p-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition border border-white/5 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 p-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:opacity-90 text-white font-semibold rounded-2xl transition disabled:opacity-50 border-0 cursor-pointer"
                                >
                                    {submitting ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Configuração de Taxas de Entrega */}
            {feesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-[#07041a] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in text-white max-h-[85vh] flex flex-col">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-white">Configurar Regiões e Taxas de Entrega</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">Cadastre o valor de entrega para cada bairro ou cidade</p>
                            </div>
                            <button 
                                onClick={() => setFeesModalOpen(false)} 
                                className="text-gray-400 hover:text-white transition text-lg bg-transparent border-0 cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Form Body (Scrollable) */}
                        <form onSubmit={handleSaveFees} className="space-y-4 text-sm flex-1 overflow-y-auto pr-1">
                            
                            {/* Mode Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Modo de Cobrança</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setDeliveryFeeType('FIXED')}
                                        className={`p-3 rounded-2xl border text-center transition cursor-pointer font-semibold ${
                                            deliveryFeeType === 'FIXED' 
                                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                        }`}
                                    >
                                        Taxa Fixa (Padrão)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setDeliveryFeeType('BY_NEIGHBORHOOD')}
                                        className={`p-3 rounded-2xl border text-center transition cursor-pointer font-semibold ${
                                            deliveryFeeType === 'BY_NEIGHBORHOOD' 
                                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                        }`}
                                    >
                                        Por Bairro / Região
                                    </button>
                                </div>
                            </div>

                            {/* Rules Table */}
                            {deliveryFeeType === 'BY_NEIGHBORHOOD' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Tabela de Valores por Região</label>
                                        <button 
                                            type="button"
                                            onClick={handleAddRule}
                                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer bg-transparent border-0"
                                        >
                                            + Adicionar Região
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                                        {deliveryFeeRules.length === 0 ? (
                                            <div className="py-6 text-center text-gray-500 text-xs border border-dashed border-white/10 rounded-2xl">
                                                Nenhuma região cadastrada. Clique em adicionar para configurar.
                                            </div>
                                        ) : (
                                            deliveryFeeRules.map((rule, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input 
                                                        type="text" 
                                                        value={rule.city || ''}
                                                        onChange={(e) => handleRuleChange(idx, 'city', e.target.value)}
                                                        placeholder="Cidade (ex: Canoas)"
                                                        className="flex-1 p-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition text-xs"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={rule.neighborhood || ''}
                                                        onChange={(e) => handleRuleChange(idx, 'neighborhood', e.target.value)}
                                                        placeholder="Bairro (ex: Centro)"
                                                        className="flex-1 p-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition text-xs"
                                                    />
                                                    <div className="relative w-28 shrink-0">
                                                        <span className="absolute left-3 top-2.5 text-xs text-gray-400">R$</span>
                                                        <input 
                                                            type="number" 
                                                            step="0.01"
                                                            value={rule.fee || 0}
                                                            onChange={(e) => handleRuleChange(idx, 'fee', parseFloat(e.target.value) || 0)}
                                                            className="w-full pl-8 p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition text-xs text-right"
                                                        />
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveRule(idx)}
                                                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer bg-transparent border-0"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex gap-3 pt-3 border-t border-white/5 shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => setFeesModalOpen(false)}
                                    className="flex-1 p-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl transition border border-white/5 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={savingFees}
                                    className="flex-1 p-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:opacity-90 text-white font-semibold rounded-2xl transition disabled:opacity-50 border-0 cursor-pointer"
                                >
                                    {savingFees ? 'Salvando...' : 'Salvar Configurações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
