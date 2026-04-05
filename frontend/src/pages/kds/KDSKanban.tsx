import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Check, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { fetchActiveKots, updateKotStatus, type KOT } from '@/lib/api';

export default function KDSKanban() {
    const [kots, setKots] = useState<KOT[]>([]);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const loadKots = useCallback(() => {
        fetchActiveKots()
            .then(data => { setKots(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Initial load
    useEffect(() => {
        loadKots();
    }, [loadKots]);

    // WebSocket connection for real-time updates
    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket('ws://localhost:8000/ws/kitchen');
            wsRef.current = ws;

            ws.onopen = () => setWsConnected(true);
            ws.onclose = () => {
                setWsConnected(false);
                // Auto-reconnect after 3 seconds
                setTimeout(connect, 3000);
            };
            ws.onerror = () => ws.close();

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'NEW_KOT') {
                        // Add new KOT to the list
                        setKots(prev => {
                            const exists = prev.some(k => k.id === msg.data.id);
                            if (exists) return prev;
                            return [...prev, msg.data as KOT];
                        });
                    } else if (msg.type === 'KOT_STATUS_UPDATE') {
                        // Update existing KOT status
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

    const getTimeAgo = (createdAt: string | null) => {
        if (!createdAt) return 'just now';
        const diff = Date.now() - new Date(createdAt).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
    };

    const TicketColumn = ({ title, status, color }: { title: string, status: 'received'|'preparing'|'ready', color: string }) => {
        const columnKots = kots.filter(k => k.status === status);
        return (
            <div className={`flex-1 flex flex-col bg-zinc-950/50 rounded-2xl border ${color} overflow-hidden`}>
                <div className={`p-4 border-b ${color} bg-black/20 flex justify-between items-center`}>
                    <h3 className="font-bold text-lg text-white">{title}</h3>
                    <span className="bg-black/40 px-3 py-1 rounded-full text-sm font-bold text-white shadow-inner">
                        {columnKots.length}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {columnKots.map(kot => (
                        <div key={kot.id} className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg p-4 flex flex-col">
                            <div className="flex justify-between items-start mb-4 pb-4 border-b border-zinc-800">
                                <div>
                                    <div className="text-xl font-bold font-mono text-white mb-1">Table #{kot.order_id}</div>
                                    <div className="text-xs text-zinc-500">KOT #{kot.id}</div>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md ${
                                    getTimeAgo(kot.created_at).includes('2') && !getTimeAgo(kot.created_at).includes('just')
                                        ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                    <Clock size={14} /> {getTimeAgo(kot.created_at)}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 mb-6">
                                {kot.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-zinc-300 font-medium">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-xs text-white border border-zinc-700">{item.quantity}</span>
                                            <span className="text-lg">{item.menu_item?.name || `Item #${item.menu_item_id}`}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto flex gap-2">
                                {status === 'received' && (
                                    <button onClick={() => handleStatusUpdate(kot.id, 'preparing')} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors">
                                        Start Preparing
                                    </button>
                                )}
                                {status === 'preparing' && (
                                    <button onClick={() => handleStatusUpdate(kot.id, 'ready')} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                                        <Check size={18} /> Mark Ready
                                    </button>
                                )}
                                {status === 'ready' && (
                                    <button onClick={() => handleClear(kot.id)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-colors">
                                        Clear Ticket
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {columnKots.length === 0 && (
                        <div className="h-full flex items-center justify-center text-zinc-700 font-medium text-lg">
                            No tickets
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                    {wsConnected ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium"><Wifi size={14} /> Live</span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium"><WifiOff size={14} /> Reconnecting...</span>
                    )}
                </div>
                <button onClick={loadKots} className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 text-zinc-400 transition-colors">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="flex flex-1 gap-6 pb-4">
                <TicketColumn title="New Orders" status="received" color="border-blue-900/50 text-blue-500" />
                <TicketColumn title="Preparing" status="preparing" color="border-orange-900/50 text-orange-500" />
                <TicketColumn title="Ready to Serve" status="ready" color="border-green-900/50 text-green-500" />
            </div>
        </div>
    );
}
