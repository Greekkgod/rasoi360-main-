import { useState, useEffect } from 'react';
import { Search, Plus, CheckSquare, Square, Zap, X, Loader2, UtensilsCrossed } from 'lucide-react';
import { fetchMenu, createMenuItem, createCategory, updateMenuItem, deleteMenuItem, fetchStations, type Category, type MenuItem, type KitchenStation } from '@/lib/api';

export default function MenuEditor() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [stations, setStations] = useState<KitchenStation[]>([]);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // New item form
    const [newItem, setNewItem] = useState({ name: '', price: 0, is_veg: true, category_id: 0, station_id: 0 });
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    const loadData = async () => {
        try {
            const [menuData, stationData] = await Promise.all([fetchMenu(), fetchStations()]);
            setCategories(menuData);
            setStations(stationData);
        } catch (error) {
            console.error("Failed to load menu data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const allItems = categories.flatMap(c => c.menu_items.map(item => ({ ...item, categoryName: c.name })));
    const filteredItems = allItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(search.toLowerCase())
    );

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        setSelectedIds(prev => prev.length === filteredItems.length ? [] : filteredItems.map(m => m.id));
    };

    const handleToggleAvailability = async (item: MenuItem) => {
        await updateMenuItem(item.id, { is_available: !item.is_available });
        loadData();
    };

    const handleBulkUnavailable = async () => {
        setSaving(true);
        for (const id of selectedIds) {
            await updateMenuItem(id, { is_available: false });
        }
        setSelectedIds([]);
        loadData();
        setSaving(false);
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Delete this menu item?')) return;
        await deleteMenuItem(id);
        loadData();
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price || !newItem.category_id) return;
        setSaving(true);
        await createMenuItem({
            ...newItem,
            station_id: newItem.station_id || undefined
        } as any);
        setNewItem({ name: '', price: 0, is_veg: true, category_id: 0, station_id: 0 });
        setShowAddModal(false);
        loadData();
        setSaving(false);
    };

    const handleAddCategory = async () => {
        if (!newCategory.name) return;
        setSaving(true);
        await createCategory(newCategory);
        setNewCategory({ name: '', description: '' });
        setShowCategoryModal(false);
        loadData();
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-pulse">
                <div className="h-16 bg-stone-200 rounded-xl" />
                <div className="h-[400px] bg-stone-200 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Menu Editor</h2>
                    <p className="text-stone-500 mt-1">Manage categories, items, and preparation stations.</p>
                </div>
                <div className="flex items-center gap-3">
                     {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-2 rounded-xl">
                             <span className="text-sm font-bold text-orange-700">{selectedIds.length} items selected</span>
                             <div className="h-4 w-px bg-orange-200 mx-1"></div>
                             <button onClick={handleBulkUnavailable} disabled={saving} className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-tight">
                                <Zap size={14} /> {saving ? 'Updating...' : 'Mark Unavailable'}
                             </button>
                        </div>
                    )}
                    <button onClick={() => setShowCategoryModal(true)} className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-stone-200">
                        <Plus size={18} /> Category
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-orange-600/20 transition-colors flex items-center gap-2">
                        <Plus size={18} /> Add Item
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-stone-100 flex items-center gap-4 bg-stone-50/50">
                    <button onClick={toggleAll} className="text-stone-400 hover:text-orange-600 transition-colors">
                        {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? <CheckSquare size={20} className="text-orange-600" /> : <Square size={20} />}
                    </button>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search menu items..." 
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="text-sm text-stone-400 font-medium ml-auto">{filteredItems.length} items</span>
                </div>

                {/* Header Row */}
                <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_100px_100px_60px] gap-4 p-4 border-b border-stone-100 bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    <div></div>
                    <div>Item Name</div>
                    <div>Category</div>
                    <div>Station</div>
                    <div className="text-right">Price</div>
                    <div className="text-center">Stock</div>
                    <div></div>
                </div>

                {/* Items list */}
                <div className="flex flex-col">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id} 
                            className={`grid grid-cols-[40px_1.5fr_1fr_1fr_100px_100px_60px] gap-4 p-4 border-b border-stone-50 items-center transition-colors group ${selectedIds.includes(item.id) ? 'bg-orange-50/50' : 'hover:bg-stone-50/30'}`}
                        >
                            <button onClick={() => toggleSelect(item.id)} className="text-stone-300 hover:text-orange-500 transition-colors">
                                {selectedIds.includes(item.id) ? <CheckSquare size={20} className="text-orange-600" /> : <Square size={20} />}
                            </button>
                            <div className="font-bold flex items-center gap-2 text-stone-800">
                                <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                {item.name}
                            </div>
                            <div>
                                <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-xs font-bold">{item.categoryName}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                                    <UtensilsCrossed size={12} className="text-stone-400" />
                                    {stations.find(s => s.id === item.station_id)?.name || 'Unassigned'}
                                </div>
                            </div>
                            <div className="text-right font-bold text-stone-900">
                                ₹{item.price}
                            </div>
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => handleToggleAvailability(item)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_available ? 'bg-orange-600' : 'bg-stone-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex justify-end text-stone-400">
                                <button 
                                    onClick={() => handleDeleteItem(item.id)} 
                                    className="p-2 hover:bg-red-50 rounded-lg hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredItems.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center gap-3">
                            <UtensilsCrossed size={48} className="text-stone-200" />
                            <p className="text-stone-400 font-medium">No menu items found. Build your menu to get started!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-stone-900">Add Menu Item</h3>
                                <p className="text-stone-500 text-sm font-medium">Fill in the details to add a new dish.</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 bg-stone-100 text-stone-400 hover:text-stone-600 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Item Name</label>
                                <input
                                    type="text" placeholder="e.g. Garlic Naan"
                                    className="w-full p-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-stone-800"
                                    value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Price (₹)</label>
                                    <input
                                        type="number" placeholder="0.00"
                                        className="w-full p-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-stone-800"
                                        value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Type</label>
                                    <div className="flex h-14 bg-stone-100 p-1 rounded-2xl">
                                        <button 
                                            onClick={() => setNewItem({...newItem, is_veg: true})}
                                            className={`flex-1 rounded-xl text-xs font-bold transition-all ${newItem.is_veg ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'}`}
                                        >
                                            VEG
                                        </button>
                                        <button 
                                            onClick={() => setNewItem({...newItem, is_veg: false})}
                                            className={`flex-1 rounded-xl text-xs font-bold transition-all ${!newItem.is_veg ? 'bg-white text-red-600 shadow-sm' : 'text-stone-500'}`}
                                        >
                                            NON-VEG
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Category</label>
                                    <select
                                        className="w-full p-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-stone-800 appearance-none bg-stone-50"
                                        value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: Number(e.target.value)})}
                                    >
                                        <option value={0}>Select...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Kitchen Station</label>
                                    <select
                                        className="w-full p-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-stone-800 appearance-none bg-stone-50"
                                        value={newItem.station_id} onChange={e => setNewItem({...newItem, station_id: Number(e.target.value)})}
                                    >
                                        <option value={0}>Automatic</option>
                                        {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleAddItem} disabled={saving || !newItem.name || !newItem.price || !newItem.category_id}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {saving ? <><Loader2 size={24} className="animate-spin" /> Adding...</> : 'Save Menu Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal (Simplified) */}
             {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-stone-900">Add Category</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="p-1 text-stone-400 hover:text-stone-600"><X size={20} /></button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <input
                                type="text" placeholder="e.g. Starters, Main Course..."
                                className="w-full p-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold"
                                value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                            />
                            <button
                                onClick={handleAddCategory} disabled={saving || !newCategory.name}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white py-4 rounded-2xl font-black text-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
