import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, Send, Trash2, Search, Ban, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchMenu, createOrder, type Category, type MenuItem } from '@/lib/api';

export default function OrderEntry() {
    const { tableId } = useParams();
    const navigate = useNavigate();

    const isValidTable = !isNaN(Number(tableId));
    if (!isValidTable) {
        return <Navigate to="/pos/tables" replace />;
    }

    const [categories, setCategories] = useState<Category[]>([]);
    const [cart, setCart] = useState<{id: number, name: string, price: number, is_veg: boolean, qty: number, note: string}[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [lastRemoved, setLastRemoved] = useState<{item: any, index: number} | null>(null);

    useEffect(() => {
        fetchMenu()
            .then(data => { setCategories(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const allItems = categories.flatMap(c => c.menu_items);
    const categoryNames = categories.map(c => c.name);

    const filteredMenu = useMemo(() => {
        return allItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || 
                categories.find(c => c.name === activeCategory)?.menu_items.some(m => m.id === item.id);
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory, allItems, categories]);

    const frequentItems = allItems.filter(m => m.is_available).slice(0, 8);

    const getItemQty = (id: number) => cart.find(i => i.id === id)?.qty || 0;

    const addToCart = (item: MenuItem) => {
        if (!item.is_available) return;
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, is_veg: item.is_veg, qty: 1, note: '' }];
        });
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = i.qty + delta;
                return newQty > 0 ? { ...i, qty: newQty } : i;
            }
            return i;
        }));
    };

    const removeItem = (id: number) => {
        const itemToRemove = cart.find(i => i.id === id);
        const index = cart.findIndex(i => i.id === id);
        if (itemToRemove) {
            setLastRemoved({ item: itemToRemove, index });
            setCart(prev => prev.filter(i => i.id !== id));
            setTimeout(() => setLastRemoved(null), 5000);
        }
    };

    const undoRemove = () => {
        if (lastRemoved) {
            setCart(prev => {
                const newCart = [...prev];
                newCart.splice(lastRemoved.index, 0, lastRemoved.item);
                return newCart;
            });
            setLastRemoved(null);
        }
    };

    const handleSendKOT = async () => {
        if (cart.length === 0) return;
        setSending(true);
        try {
            await createOrder({
                table_id: Number(tableId),
                user_id: 2, // Waiter
                items: cart.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.qty,
                    special_instructions: item.note || undefined
                })),
            });
            setSent(true);
            setCart([]);
            setTimeout(() => {
                navigate('/pos/tables');
            }, 2000);
        } catch (err) {
            console.error('KOT send failed:', err);
            setSending(false);
        }
    };

    const total = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

    if (sent) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-800">KOT Sent to Kitchen!</h2>
                    <p className="text-stone-500">Table {tableId} • Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full max-w-[1400px] mx-auto gap-6">
            {/* Left Menu Side */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50/30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-stone-800 tracking-tight">Table {tableId}</h2>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search dishes..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-stone-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                </div>
                
                {/* Categories Tab */}
                <div className="flex gap-2 p-4 overflow-x-auto border-b border-stone-100 no-scrollbar bg-white">
                   <button 
                        onClick={() => setActiveCategory('All')}
                        className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                            activeCategory === 'All' 
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                    >
                        ⚡ All
                    </button>
                   {categoryNames.map(c => (
                       <button 
                            key={c} 
                            onClick={() => setActiveCategory(c)}
                            className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                                activeCategory === c 
                                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                           {c}
                       </button>
                   ))}
                </div>

                {/* Items Grid */}
                <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto content-start">
                    {loading ? (
                        [1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-stone-100 rounded-2xl animate-pulse" />)
                    ) : (
                        (activeCategory === 'All' ? frequentItems : filteredMenu).map(item => {
                            const qty = getItemQty(item.id);
                            const isAvailable = item.is_available;
                            
                            return (
                                <div 
                                    key={item.id} 
                                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all relative group h-32 ${
                                        qty > 0 
                                        ? 'border-orange-500 bg-orange-50/30 shadow-sm ring-1 ring-orange-500' 
                                        : !isAvailable
                                        ? 'border-stone-100 bg-stone-50/50 opacity-60'
                                        : 'border-stone-200 hover:border-orange-300 bg-white hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                                            {categories.find(c => c.menu_items.some(m => m.id === item.id))?.name || ''}
                                        </span>
                                        <span className={`w-3 h-3 border flex items-center justify-center p-[1px] ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                            <span className={`w-full h-full rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        </span>
                                    </div>
                                    <span className={`font-bold text-base text-stone-800 leading-tight mb-auto line-clamp-2 ${!isAvailable ? 'line-through decoration-stone-400' : ''}`}>{item.name}</span>
                                    
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-stone-900">₹{item.price}</span>
                                        
                                        {!isAvailable ? (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 uppercase tracking-tighter bg-white px-2 py-1 rounded-md border border-stone-200">
                                                <Ban size={12} /> 86'd
                                            </div>
                                        ) : qty === 0 ? (
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="bg-white border border-stone-200 text-orange-600 p-1.5 rounded-lg hover:border-orange-500 transition-colors shadow-sm"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        ) : (
                                            <div className="flex items-center bg-white border border-orange-500 rounded-lg overflow-hidden shadow-sm">
                                                <button onClick={() => updateQty(item.id, -1)} className="px-2 py-1 hover:bg-orange-50 text-orange-600 transition-colors"><Minus size={14} /></button>
                                                <span className="px-2 font-bold text-orange-700 text-sm">{qty}</span>
                                                <button onClick={() => addToCart(item)} className="px-2 py-1 hover:bg-orange-50 text-orange-600 transition-colors"><Plus size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Cart Side */}
            <div className="w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-5 border-b border-stone-100 bg-stone-50">
                    <h3 className="text-xl font-bold text-stone-800">Current Order</h3>
                    <p className="text-stone-500 text-sm">Table {tableId}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {lastRemoved && (
                        <div className="bg-stone-800 text-white p-3 rounded-xl flex items-center justify-between">
                            <span className="text-sm">Removed {lastRemoved.item.name}</span>
                            <button onClick={undoRemove} className="text-orange-400 text-sm font-bold uppercase hover:text-orange-300 transition-colors">Undo</button>
                        </div>
                    )}
                    
                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-stone-400 text-center px-8">
                            <div className="w-16 h-16 border-2 border-dashed border-stone-300 rounded-full flex items-center justify-center mb-4">
                               <Plus className="text-stone-300" />
                            </div>
                            <p>Select items from the menu to add to this order.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center group">
                                <div className="flex flex-col">
                                    <span className="font-bold text-stone-800">{item.name}</span>
                                    <span className="text-sm text-stone-500">₹{item.price}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
                                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded bg-white shadow-sm text-stone-600 hover:text-orange-600"><Minus size={16}/></button>
                                            <span className="w-6 text-center font-bold text-stone-800">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded bg-white shadow-sm text-stone-600 hover:text-orange-600"><Plus size={16}/></button>
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Add note..."
                                            value={item.note}
                                            onChange={(e) => setCart(prev => prev.map(i => i.id === item.id ? {...i, note: e.target.value} : i))}
                                            className="text-[10px] w-24 bg-transparent border-b border-stone-200 focus:border-orange-500 outline-none text-right text-stone-500 italic"
                                        />
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 border-t border-stone-100 bg-stone-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-stone-600 font-medium">Subtotal</span>
                        <span className="text-xl font-bold text-stone-800">₹{total}</span>
                    </div>
                    <button 
                        disabled={cart.length === 0 || sending}
                        onClick={handleSendKOT}
                        className="w-full bg-orange-600 disabled:bg-stone-300 disabled:cursor-not-allowed hover:bg-orange-700 text-white py-4 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
                    >
                        {sending ? (
                            <><Loader2 size={20} className="animate-spin" /> Sending...</>
                        ) : (
                            <><Send size={20} /> Send KOT to Kitchen</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
