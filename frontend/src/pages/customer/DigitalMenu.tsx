import { useState, useEffect } from 'react';
import { Search, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMenu, type Category, type MenuItem } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';

export default function DigitalMenu() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const { items: cartItems, addItem, updateQty, removeItem, getItemCount, setTableId } = useCartStore();
    const cartCount = getItemCount();

    // Capture table ID from QR code URL param (e.g. /?table=5)
    useEffect(() => {
        const tableParam = searchParams.get('table');
        if (tableParam) {
            const id = parseInt(tableParam, 10);
            if (!isNaN(id) && id > 0) {
                setTableId(id);
            }
        }
    }, [searchParams, setTableId]);

    useEffect(() => {
        fetchMenu()
            .then(data => {
                setCategories(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const allItems = categories.flatMap(c => c.menu_items.map(item => ({ ...item, categoryName: c.name })));
    const categoryNames = ['All', ...categories.map(c => c.name)];

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeTab === 'All' || item.categoryName === activeTab;
        return matchesSearch && matchesCategory && item.is_available;
    });

    const getQty = (id: number) => cartItems.find(i => i.id === id)?.qty || 0;

    const handleAdd = (item: MenuItem) => {
        addItem({ id: item.id, name: item.name, price: item.price, is_veg: item.is_veg });
    };

    const handleUpdateQty = (id: number, delta: number) => {
        const current = getQty(id);
        if (current + delta <= 0) {
            removeItem(id);
        } else {
            updateQty(id, delta);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 max-w-lg mx-auto animate-pulse">
                <div className="h-12 bg-stone-200 rounded-2xl" />
                <div className="flex gap-3 overflow-hidden">
                    {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 bg-stone-200 rounded-2xl shrink-0" />)}
                </div>
                {[1,2,3].map(i => <div key={i} className="h-36 bg-stone-200 rounded-3xl" />)}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-lg mx-auto relative">
            {/* Search Bar */}
            <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search for dishes..." 
                    className="w-full bg-white pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-stone-700 transition-all placeholder:text-stone-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Categories Scroll */}
            <div className="-mx-4 px-4 overflow-x-auto no-scrollbar pb-2">
                <div className="flex gap-3">
                    {categoryNames.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-2xl font-semibold transition-colors shadow-sm cursor-pointer ${
                                activeTab === cat 
                                ? 'bg-orange-600 text-white shadow-orange-600/20 border-orange-600' 
                                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col gap-4 pb-20">
                <h3 className="font-bold text-xl text-stone-800">{activeTab}</h3>
                
                {filteredItems.length === 0 && (
                    <div className="text-center text-stone-400 py-12">No items found</div>
                )}

                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex gap-4 overflow-hidden relative">
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-3 h-3 border flex items-center justify-center p-[1px] ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                    <span className={`w-full h-full rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                </span>
                                <h4 className="font-bold text-stone-800 text-lg leading-tight">{item.name}</h4>
                            </div>
                            <span className="font-bold text-stone-900 mt-1 mb-2">₹{item.price}</span>
                            <p className="text-stone-500 text-sm leading-snug line-clamp-2">{item.categoryName}</p>
                        </div>

                        <div className="flex flex-col items-center w-32 relative">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-32 h-32 object-cover rounded-2xl shadow-sm bg-stone-100" />
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center text-3xl">
                                    {item.is_veg ? '🥬' : '🍗'}
                                </div>
                            )}
                            
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-10">
                                {!getQty(item.id) ? (
                                    <button 
                                        onClick={() => handleAdd(item)}
                                        className="w-full h-full bg-white border border-orange-200 text-orange-600 font-bold rounded-xl shadow-md hover:bg-orange-50 transition-all uppercase tracking-wide text-sm flex items-center justify-center"
                                    >
                                        Add
                                    </button>
                                ) : (
                                    <div className="w-full h-full bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-between px-2">
                                        <button onClick={() => handleUpdateQty(item.id, -1)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                            <Minus size={18} />
                                        </button>
                                        <span className="font-bold">{getQty(item.id)}</span>
                                        <button onClick={() => handleUpdateQty(item.id, 1)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Cart Banner */}
            {cartCount > 0 && (
                <div className="fixed bottom-24 left-4 right-4 z-50 flex max-w-lg mx-auto">
                    <button 
                        onClick={() => navigate('/cart')}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-between transition-transform active:scale-[0.98]"
                    >
                        <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold">{cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'} ADDED</span>
                            <span className="text-sm text-orange-100">Review your order</span>
                        </div>
                        <div className="font-bold flex items-center gap-2">
                            View Cart <ShoppingCart size={20}/>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
