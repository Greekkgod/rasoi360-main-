import { useState, useEffect } from 'react';
import { QrCode, Printer, Download, ExternalLink, Loader2, ChefHat } from 'lucide-react';
import { fetchTables, type RestaurantTable } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function QRGenerator() {
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [loading, setLoading] = useState(true);
    const user = useAuthStore(state => state.user);
    
    const restaurantSlug = user?.restaurant_slug || 'default';

    const loadTables = () => {
        fetchTables()
            .then(data => { setTables(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadTables(); }, []);

    const getTableUrl = (tableId: number) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/${restaurantSlug}?table=${tableId}`;
    };

    const getQrUrl = (url: string) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&margin=10&bgcolor=ffffff&color=000000`;
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="animate-pulse space-y-6"><div className="h-16 bg-stone-200 rounded-xl" /><div className="grid grid-cols-3 gap-6"><div className="h-64 bg-stone-200 rounded-3xl" /></div></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-3xl font-black text-stone-800 tracking-tight flex items-center gap-3">
                        <QrCode className="text-orange-600" size={32} /> QR Code Manager
                    </h2>
                    <p className="text-stone-500 font-medium mt-1">Download or print unique QR codes for your tables.</p>
                </div>
                <button 
                    onClick={handlePrint}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95"
                >
                    <Printer size={20} /> Print All Cards
                </button>
            </div>

            {/* Print Instructions */}
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex items-start gap-4 print:hidden">
                <div className="bg-orange-600 p-2 rounded-xl text-white">
                    <ChefHat size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-orange-900">How to use:</h4>
                    <p className="text-orange-700 text-sm mt-1 leading-relaxed">
                        Place these QR codes on your tables. When customers scan them, they'll see your digital menu 
                        and their orders will be automatically linked to that specific table.
                    </p>
                </div>
            </div>

            {/* QR Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {tables.map(table => {
                    const url = getTableUrl(table.id);
                    const qrUrl = getQrUrl(url);

                    return (
                        <div key={table.id} className="bg-white border-2 border-stone-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center transition-all hover:border-orange-500 hover:shadow-xl group relative overflow-hidden break-inside-avoid">
                            {/* Card Decoration */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-orange-600"></div>
                            
                            <div className="mb-6">
                                <div className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Welcome to</div>
                                <h3 className="text-2xl font-black text-stone-900 leading-tight">Rasoi360 Dining</h3>
                            </div>

                            {/* QR Frame */}
                            <div className="relative p-4 bg-stone-50 rounded-3xl border-2 border-stone-100 group-hover:border-orange-100 transition-colors">
                                <img 
                                    src={qrUrl} 
                                    alt={`Table ${table.table_number}`} 
                                    className="w-48 h-48 rounded-xl mix-blend-multiply"
                                />
                            </div>

                            <div className="mt-6 space-y-2">
                                <div className="text-stone-400 font-bold text-xs uppercase tracking-widest">Table</div>
                                <div className="text-4xl font-black text-orange-600">{table.table_number}</div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-50 w-full">
                                <p className="text-stone-500 text-xs font-bold leading-relaxed">
                                    Scan to view our <br/>
                                    <span className="text-stone-800 uppercase tracking-tighter font-black">Digital Menu</span>
                                </p>
                            </div>

                            {/* Action Overlay - Hidden on Print */}
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <a 
                                    href={qrUrl} 
                                    download={`QR_Table_${table.table_number}.png`}
                                    className="w-48 py-3 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                                >
                                    <Download size={18} /> Download Image
                                </a>
                                <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-48 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
                                >
                                    <ExternalLink size={18} /> Test Link
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Print Styling */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    main { padding: 0 !important; }
                    .grid { grid-template-cols: repeat(2, 1fr) !important; gap: 40px !important; }
                    .rounded-\\[2\\.5rem\\] { border-radius: 1rem !important; border: 1px solid #e5e7eb !important; }
                }
            `}</style>
        </div>
    );
}
