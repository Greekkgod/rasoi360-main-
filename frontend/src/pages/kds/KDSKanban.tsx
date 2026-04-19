import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Check, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { fetchActiveKots, updateKotStatus, type KOT } from '@/lib/api';

// Simple beep generator for new orders
const playAlertSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 300);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

export default function KDSKanban() {
    const [kots, setKots] = useState<KOT[]>([]);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const wsRef = useRef<WebSocket | null>(null);

    // Update current time every minute to refresh ticket ages
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const loadKots = useCallback(() => {
        fetchActiveKots()
            .then(data => { setKots(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => { loadKots(); }, [loadKots]);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket('ws://localhost:8000/ws/kitchen');
            wsRef.current = ws;

            ws.onopen = () => setWsConnected(true);
            ws.onclose = () => {
                setWsConnected(false);
                setTimeout(connect, 3000);
            };
            ws.onerror = () => ws.close();

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'NEW_KOT') {
                        setKots(prev => {
                            const exists = prev.some(k => k.id === msg.data.id);
                            if (exists) return prev;
                            playAlertSound(); // Trigger Audio Alert
                            return [...prev, msg.data as KOT];
                        });
                    } else if (msg.type === 'KOT_STATUS_UPDATE') {
                        setKots(prev => prev.map(k => 
                            k.id === msg.data.id ? { ...k, status: msg.data.status } : k
                        ));
                    }
                } catch (e) {
                    console.error('WS parse error:', e);
                }
            };
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const handleStatusUpdate = async (kotId: number, newStatus: string) => {
        try {
            await updateKotStatus(kotId, newStatus);
            setKots(prev => prev.map(k => k.id === kotId ? { ...k, status: newStatus as KOT['status'] } : k));
        } catch (err) {
            console.error('Status update failed:', err);
        }
    };

    const handleClear = (kotId: number) => {
        setKots(prev => prev.filter(k => k.id !== kotId));
    };

    const getTicketAgeMinutes = (createdAt: string | null) => {
        if (!createdAt) return 0;
        return Math.floor((currentTime - new Date(createdAt).getTime()) / 60000);
    };

    const formatTimeAgo = (mins: number) => {
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
    };

    // Determine color coding based on age
    const getTicketUrgencyStyle = (mins: number, status: string) => {
        if (status === 'ready') return 'border-zinc-800 bg-zinc-900'; // Ready tickets aren't urgent
        
        if (mins >= 10) return 'border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-[pulse_2s_ease-in-out_infinite]'; // Critical
        if (mins >= 5) return 'border-yellow-500 bg-yellow-950/20'; // Warning
        return 'border-zinc-700 bg-zinc-900'; // Normal
    };

    const TicketColumn = ({ title, status, headerColor }: { title: string, status: 'received'|'preparing'|'ready', headerColor: string }) => {
        const columnKots = kots.filter(k => k.status === status).sort((a, b) => {
             // Sort oldest first
             const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
             const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
             return timeA - timeB;
        });

        return (
            <div className={`flex-1 flex flex-col bg-zinc-950/80 rounded-3xl border border-zinc-800 overflow-hidden`}>
                <div className={`p-5 border-b border-zinc-800 flex justify-between items-center ${headerColor}`}>
                    <h3 className="font-black text-xl text-white tracking-wide">{title}</h3>
                    <span className="bg-black/40 px-4 py-1.5 rounded-full text-base font-bold text-white shadow-inner">
                        {columnKots.length}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                    {columnKots.map(kot => {
                        const ageMins = getTicketAgeMinutes(kot.created_at);
                        const urgencyStyle = getTicketUrgencyStyle(ageMins, status);
                        const isCritical = ageMins >= 10 && status !== 'ready';

                        return (
                            <div key={kot.id} className={`border-2 rounded-2xl p-5 flex flex-col transition-all ${urgencyStyle}`}>
                                <div className="flex justify-between items-start mb-5 pb-5 border-b border-zinc-800/50">
                                    <div>
                                        <div className="text-3xl font-black font-mono text-white tracking-tighter mb-1">
                                            TBL {kot.order_id}
                                        </div>
                                        <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">KOT #{kot.id}</div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg ${
                                        isCritical ? 'bg-red-500 text-white' : ageMins >= 5 && status !== 'ready' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                        {isCritical ? <AlertTriangle size={16} className="animate-bounce" /> : <Clock size={16} />}
                                        {formatTimeAgo(ageMins)}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-4 mb-8">
                                    {kot.items.map(item => (
                                        <div key={item.id} className="flex items-start gap-4 text-zinc-100 font-bold text-xl leading-tight">
                                            <span className="w-10 h-10 shrink-0 rounded-xl bg-zinc-800 flex items-center justify-center text-white border-2 border-zinc-700 shadow-inner">
                                                {item.quantity}
                                            </span>
                                            <div className="flex flex-col pt-1">
                                                <span>{item.menu_item?.name || `Item #${item.menu_item_id}`}</span>
                                                {item.special_instructions && (
                                                    <span className="text-sm font-medium text-orange-400 mt-1 bg-orange-500/10 px-2 py-1 rounded-md w-fit">
                                                        Note: {item.special_instructions}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    {status === 'received' && (
                                        <button 
                                            onClick={() => handleStatusUpdate(kot.id, 'preparing')} 
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xl py-6 rounded-xl transition-all shadow-lg active:scale-95"
                                        >
                                            Start Preparing
                                        </button>
                                    )}
                                    {status === 'preparing' && (
                                        <button 
                                            onClick={() => handleStatusUpdate(kot.id, 'ready')} 
                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black text-xl py-6 rounded-xl transition-all shadow-lg shadow-green-600/20 flex justify-center items-center gap-3 active:scale-95"
                                        >
                                            <Check size={28} /> Mark Ready
                                        </button>
                                    )}
                                    {status === 'ready' && (
                                        <button 
                                            onClick={() => handleClear(kot.id)} 
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-lg py-5 rounded-xl transition-all active:scale-95"
                                        >
                                            Clear Ticket
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {columnKots.length === 0 && (
                        <div className="h-full flex items-center justify-center text-zinc-700 font-medium text-xl">
                            No tickets
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full max-w-[1800px] mx-auto bg-black p-4">
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase">Kitchen Display</h2>
                    {wsConnected ? (
                        <span className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-500/30">
                            <Wifi size={16} /> Live
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-500/30">
                            <WifiOff size={16} /> Reconnecting...
                        </span>
                    )}
                </div>
                <button onClick={loadKots} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors shadow-sm">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="flex flex-1 gap-6 pb-2 h-[calc(100vh-120px)]">
                <TicketColumn title="New Orders" status="received" headerColor="bg-blue-900/30" />
                <TicketColumn title="Preparing" status="preparing" headerColor="bg-orange-900/30" />
                <TicketColumn title="Ready" status="ready" headerColor="bg-green-900/30" />
            </div>
        </div>
    );
}
