import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Users, RefreshCw } from 'lucide-react';
import { fetchTables, type RestaurantTable } from '@/lib/api';

export default function TableGrid() {
    const navigate = useNavigate();
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTables = () => {
        setLoading(true);
        fetchTables()
            .then(data => { setTables(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        let isMounted = true;
        const fetchAndSet = () => {
             fetchTables().then(data => {
                 if (isMounted) {
                     setTables(data);
                     setLoading(false);
                 }
             }).catch(() => {
                 if (isMounted) setLoading(false);
             });
        };
        
        fetchAndSet();
        const interval = setInterval(fetchAndSet, 10000); // Refresh every 10s
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
            case 'Occupied': return 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100';
            case 'Reserved': return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
            default: return 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Available': return <CheckCircle2 size={16} className="text-emerald-600" />;
            case 'Occupied': return <Clock size={16} className="text-orange-600" />;
            case 'Reserved': return <Users size={16} className="text-blue-600" />;
            default: return null;
        }
    };

    const statusCounts = {
        Available: tables.filter(t => t.status === 'Available').length,
        Occupied: tables.filter(t => t.status === 'Occupied').length,
        Reserved: tables.filter(t => t.status === 'Reserved').length,
    };

    if (loading && tables.length === 0) {
        return (
            <div className="flex flex-col h-full w-full max-w-6xl mx-auto animate-pulse">
                <div className="h-16 bg-stone-200 rounded-xl mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-stone-200 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
             <div className="flex justify-between items-end mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-stone-800">Restaurant Floor</h2>
                    <p className="text-stone-500 text-sm">Select a table to open a ticket or update order.</p>
                 </div>
                 <div className="flex items-center gap-4">
                     <div className="flex gap-4 text-sm font-medium">
                         <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Available ({statusCounts.Available})</div>
                         <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Occupied ({statusCounts.Occupied})</div>
                         <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Reserved ({statusCounts.Reserved})</div>
                     </div>
                     <button onClick={loadTables} className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-500 transition-colors">
                         <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {tables.map(table => (
                     <button 
                        key={table.id}
                        onClick={() => navigate(`/pos/order/${table.id}`)}
                        className={`text-left p-5 rounded-2xl border-2 transition-all shadow-sm ${getStatusColor(table.status)} relative group overflow-hidden active:scale-95`}
                     >
                         <div className="flex justify-between items-start mb-4">
                             <h3 className="text-2xl font-bold font-mono tracking-tight">{table.table_number}</h3>
                             <div className="bg-white/60 p-1.5 rounded-lg shadow-sm backdrop-blur-sm">
                                 {getStatusIcon(table.status)}
                             </div>
                         </div>
                         <div className="flex flex-col gap-1">
                             <div className="text-sm font-medium flex justify-between">
                                 <span className="opacity-70">Status</span>
                                 <span className="font-bold">{table.status}</span>
                             </div>
                         </div>
                     </button>
                 ))}
             </div>
        </div>
    );
}
