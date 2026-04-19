import { useState, useEffect } from 'react';
import { Plus, Trash2, LayoutGrid, CheckCircle2, Loader2, X } from 'lucide-react';
import { fetchTables, createTable, type RestaurantTable } from '@/lib/api';

export default function TableManager() {
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');

    const loadTables = () => {
        fetchTables()
            .then(data => { setTables(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadTables(); }, []);

    const handleCreateTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableNumber) return;
        setSaving(true);
        try {
            await createTable({ table_number: newTableNumber });
            setNewTableNumber('');
            setShowAddModal(false);
            loadTables();
        } catch (error) {
            console.error("Failed to create table", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse flex flex-col gap-6"><div className="h-16 bg-stone-200 rounded-xl" /><div className="grid grid-cols-4 gap-4"><div className="h-32 bg-stone-200 rounded-2xl" /></div></div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-stone-800 tracking-tight">Table Layout</h2>
                    <p className="text-stone-500 font-medium">Manage your restaurant floor and table identifiers.</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus size={20} /> Add New Table
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {tables.map(table => (
                    <div key={table.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center gap-4 relative group hover:border-orange-500 transition-colors">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${table.status === 'Occupied' ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-400'}`}>
                            <LayoutGrid size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Table</p>
                            <h4 className="text-2xl font-black text-stone-900">{table.table_number}</h4>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${table.status === 'Occupied' ? 'bg-orange-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                            {table.status}
                        </div>
                    </div>
                ))}

                {tables.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                        <LayoutGrid size={48} className="mx-auto text-stone-300 mb-4" />
                        <p className="text-stone-500 font-bold">No tables added yet.</p>
                        <button onClick={() => setShowAddModal(true)} className="text-orange-600 font-bold hover:underline mt-2">Create your first table</button>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
                    <form onSubmit={handleCreateTable} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-stone-900">Add Table</h3>
                            <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-stone-400 hover:text-stone-600 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Table Label / Number</label>
                                <input
                                    autoFocus
                                    required
                                    type="text" 
                                    placeholder="e.g. T-01 or Table 5"
                                    className="w-full p-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-orange-500 font-black text-xl text-stone-800"
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(e.target.value)}
                                />
                            </div>
                            <button
                                disabled={saving || !newTableNumber}
                                type="submit"
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 size={24} className="animate-spin" /> Adding...</> : <><CheckCircle2 size={20} /> Create Table</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
