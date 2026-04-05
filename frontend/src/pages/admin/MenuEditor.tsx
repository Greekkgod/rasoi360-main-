import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, CheckSquare, Square, Zap, X, Loader2 } from 'lucide-react';
import { fetchMenu, createMenuItem, createCategory, updateMenuItem, deleteMenuItem, type Category, type MenuItem } from '@/lib/api';

export default function MenuEditor() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // New item form
    const [newItem, setNewItem] = useState({ name: '', price: 0, is_veg: true, category_id: 0 });
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    const loadMenu = () => {
        fetchMenu()
            .then(data => { setCategories(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadMenu(); }, []);

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
        loadMenu();
    };

    const handleBulkUnavailable = async () => {
        setSaving(true);
        for (const id of selectedIds) {
            await updateMenuItem(id, { is_available: false });
        }
        setSelectedIds([]);
        loadMenu();
        setSaving(false);
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Delete this menu item?')) return;
        await deleteMenuItem(id);
        loadMenu();
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price || !newItem.category_id) return;
        setSaving(true);
        await createMenuItem(newItem);
        setNewItem({ name: '', price: 0, is_veg: true, category_id: 0 });
        setShowAddModal(false);
        loadMenu();
        setSaving(false);
    };

    const handleAddCategory = async () => {
        if (!newCategory.name) return;
        setSaving(true);
        await createCategory(newCategory);
        setNewCategory({ name: '', description: '' });
        setShowCategoryModal(false);
        loadMenu();
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
                    <p className="text-stone-500 mt-1">Manage categories, items, and stock status.</p>
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
                    <button onClick={() => setShowCategoryModal(true)} className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Plus size={18} /> Category
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
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
                    <span className="text-sm text-stone-400 font-medium">{filteredItems.length} items</span>
                </div>

                {/* Header Row */}
                <div className="grid grid-cols-[40px_1fr_1fr_100px_120px_60px] gap-4 p-4 border-b border-stone-100 bg-stone-50 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    <div></div>
                    <div>Name</div>
                    <div>Category</div>
                    <div className="text-right">Price</div>
                    <div className="text-center">Stock</div>
                    <div></div>
                </div>

                {/* Items list */}
                <div className="flex flex-col">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id} 
                            className={`grid grid-cols-[40px_1fr_1fr_100px_120px_60px] gap-4 p-4 border-b border-stone-50 items-center transition-colors group ${selectedIds.includes(item.id) ? 'bg-orange-50/50' : 'hover:bg-stone-50/50'}`}
                        >
                            <button onClick={() => toggleSelect(item.id)} className="text-stone-300 hover:text-orange-500 transition-colors">
                                {selectedIds.includes(item.id) ? <CheckSquare size={20} className="text-orange-600" /> : <Square size={20} />}
                            </button>
                            <div className="font-medium flex items-center gap-2 text-stone-800">
                                <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {item.name}
                            </div>
                            <div className="text-stone-500 text-sm">
                                <span className="bg-stone-100 px-2 py-1 rounded-md">{item.categoryName}</span>
                            </div>
                            <div className="text-right font-medium text-stone-900">
                                ₹{item.price}
                            </div>
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => handleToggleAvailability(item)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_available ? 'bg-orange-500' : 'bg-stone-200'}`}
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
                        <div className="p-12 text-center text-stone-400">
                            No menu items found. Add your first item!
                        </div>
                    )}
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-stone-800">Add Menu Item</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 text-stone-400 hover:text-stone-600"><X size={20} /></button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <input
                                type="text" placeholder="Item name"
                                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                            />
                            <input
                                type="number" placeholder="Price (₹)"
                                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                            />
                            <select
                                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: Number(e.target.value)})}
                            >
                                <option value={0}>Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={newItem.is_veg} onChange={e => setNewItem({...newItem, is_veg: e.target.checked})} className="w-4 h-4 accent-green-600" />
                                <span className="text-stone-700 font-medium">Vegetarian</span>
                            </label>
                            <button
                                onClick={handleAddItem} disabled={saving || !newItem.name || !newItem.price || !newItem.category_id}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={18} className="animate-spin" /> Adding...</> : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-stone-800">Add Category</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="p-1 text-stone-400 hover:text-stone-600"><X size={20} /></button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <input
                                type="text" placeholder="Category name"
                                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                            />
                            <input
                                type="text" placeholder="Description (optional)"
                                className="w-full p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                            />
                            <button
                                onClick={handleAddCategory} disabled={saving || !newCategory.name}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={18} className="animate-spin" /> Adding...</> : 'Add Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
