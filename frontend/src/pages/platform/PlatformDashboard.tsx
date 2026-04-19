import { useEffect, useState } from 'react';
import { fetchAllRestaurants, updateRestaurantStatus, type PlatformRestaurant } from '@/lib/api';
import { Building2, Calendar, CheckCircle2, XCircle, Clock, Search, ExternalLink, ArrowRight } from 'lucide-react';

export default function PlatformDashboard() {
    const [restaurants, setRestaurants] = useState<PlatformRestaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState<number | null>(null);

    const loadRestaurants = () => {
        setLoading(true);
        fetchAllRestaurants()
            .then(setRestaurants)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRestaurants();
    }, []);

    const handleStatusChange = async (id: number, status: string, extendDays?: number) => {
        setUpdating(id);
        try {
            await updateRestaurantStatus(id, { subscription_status: status, extend_trial_days: extendDays });
            await loadRestaurants(); // Refresh data
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update restaurant status.");
        } finally {
            setUpdating(null);
        }
    };

    const filtered = restaurants.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'trial': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Platform Overview</h2>
                    <p className="text-stone-400 text-sm mt-1">Manage tenant subscriptions, trials, and active instances.</p>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search tenants..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-stone-950/50 border border-stone-800/60 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-stone-800/30 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-stone-800 p-3 rounded-xl border border-stone-700">
                            <Building2 size={24} className="text-stone-300" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-stone-400 uppercase tracking-wider">Total Tenants</p>
                            <p className="text-3xl font-bold text-white mt-1">{restaurants.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-stone-950/50 border border-stone-800/60 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-stone-400 uppercase tracking-wider">Active Subs</p>
                            <p className="text-3xl font-bold text-white mt-1">{restaurants.filter(r => r.subscription_status === 'active').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-stone-950/50 border border-stone-800/60 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                            <Clock size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-stone-400 uppercase tracking-wider">On Trial</p>
                            <p className="text-3xl font-bold text-white mt-1">{restaurants.filter(r => r.subscription_status === 'trial').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-stone-950/50 border border-stone-800/60 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
                     <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            <XCircle size={24} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-stone-400 uppercase tracking-wider">Expired</p>
                            <p className="text-3xl font-bold text-white mt-1">{restaurants.filter(r => r.subscription_status === 'expired').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-stone-300">
                        <thead className="bg-stone-900 border-b border-stone-800 text-xs uppercase font-bold tracking-wider text-stone-400">
                            <tr>
                                <th className="px-6 py-4">Restaurant</th>
                                <th className="px-6 py-4">Subdomain / Slug</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Trial Ends</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading tenants...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                                        <Building2 size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-lg font-medium">No tenants found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(restaurant => {
                                    const isExpired = restaurant.subscription_status === 'expired';
                                    const isTrial = restaurant.subscription_status === 'trial';
                                    const isActive = restaurant.subscription_status === 'active';
                                    
                                    return (
                                        <tr key={restaurant.id} className="hover:bg-stone-900/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-base">{restaurant.name}</div>
                                                <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                                                    Joined {new Date(restaurant.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-stone-800 text-stone-300 font-mono text-xs px-2 py-1 rounded-md border border-stone-700">
                                                        {restaurant.slug}
                                                    </span>
                                                    <a href={`/${restaurant.slug}`} target="_blank" rel="noreferrer" className="text-orange-500 hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100" title="Visit Digital Menu">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(restaurant.subscription_status)}`}>
                                                    {isActive && <CheckCircle2 size={12} />}
                                                    {isTrial && <Clock size={12} />}
                                                    {isExpired && <XCircle size={12} />}
                                                    {restaurant.subscription_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {restaurant.trial_ends_at ? (
                                                    <div className={`flex items-center gap-2 ${isExpired ? 'text-red-400' : 'text-stone-300'}`}>
                                                        <Calendar size={14} className="opacity-70" />
                                                        {new Date(restaurant.trial_ends_at).toLocaleDateString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-600 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {updating === restaurant.id ? (
                                                        <div className="px-4 py-2 bg-stone-800 text-stone-400 rounded-lg text-xs font-bold flex items-center gap-2">
                                                            <div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                                                            Updating
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {(isExpired || isTrial) && (
                                                                <button 
                                                                    onClick={() => handleStatusChange(restaurant.id, 'active')}
                                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-1.5"
                                                                >
                                                                    <CheckCircle2 size={14} /> Activate
                                                                </button>
                                                            )}
                                                            {isTrial && (
                                                                <button 
                                                                    onClick={() => handleStatusChange(restaurant.id, 'trial', 7)}
                                                                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold border border-stone-700 transition-colors flex items-center gap-1.5"
                                                                >
                                                                    +7 Days
                                                                </button>
                                                            )}
                                                            {isActive && (
                                                                <button 
                                                                    onClick={() => handleStatusChange(restaurant.id, 'expired')}
                                                                    className="px-3 py-1.5 bg-stone-800 hover:bg-red-900/50 hover:text-red-400 hover:border-red-900/50 text-stone-400 rounded-lg text-xs font-bold border border-stone-700 transition-colors flex items-center gap-1.5"
                                                                >
                                                                    <XCircle size={14} /> Suspend
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => handleImpersonate(restaurant)}
                                                                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-orange-600/20 ml-2"
                                                                title="Login as this restaurant"
                                                            >
                                                                <UserCircle2 size={14} /> Impersonate
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
