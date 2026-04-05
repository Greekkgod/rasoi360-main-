import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { AlertCircle, TrendingUp, RefreshCw, ChefHat, ShoppingBag, Armchair, IndianRupee } from 'lucide-react';
import { fetchDashboardStats, fetchOrders, type DashboardStats } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchDashboardStats(),
      fetchOrders().catch(() => [])
    ]).then(([statsData, ordersData]) => {
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 10));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Build chart data from recent orders
  const revenueData = recentOrders.length > 0
    ? recentOrders.slice(0, 7).map((order, i) => ({
        name: `Order ${order.id}`,
        revenue: order.total_amount + order.tax_amount,
        base: order.total_amount,
      }))
    : [
        { name: 'No data', revenue: 0, base: 0 },
      ];

  const kotData = stats ? [
    { name: 'Pending', value: stats.pending_kots, color: '#3b82f6' },
    { name: 'Preparing', value: stats.preparing_kots, color: '#f97316' },
    { name: 'Ready', value: stats.ready_kots, color: '#22c55e' },
  ].filter(d => d.value > 0) : [];

  const COLORS = ['#3b82f6', '#f97316', '#22c55e'];

  if (loading && !stats) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-stone-200 rounded-2xl" />)}
        </div>
        <div className="h-[350px] bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-stone-800 tracking-tight">Overview</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-stone-500 bg-white px-3 py-1.5 rounded-xl border border-stone-100 shadow-sm text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live System Status
          </div>
          <button onClick={loadData} className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-500 transition-colors">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><IndianRupee size={20} className="text-green-600" /></div>
            </div>
            <h3 className="text-stone-500 font-medium mb-1 text-sm">Total Revenue</h3>
            <div className="text-2xl lg:text-3xl font-bold text-stone-800">₹{stats?.total_revenue?.toLocaleString() || 0}</div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><ShoppingBag size={20} className="text-blue-600" /></div>
            </div>
            <h3 className="text-stone-500 font-medium mb-1 text-sm">Total Orders</h3>
            <div className="text-2xl lg:text-3xl font-bold text-stone-800">{stats?.total_orders || 0}</div>
            <div className="text-stone-500 text-xs mt-1 font-medium">Avg ₹{stats?.avg_order_value?.toLocaleString() || 0}</div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><Armchair size={20} className="text-amber-600" /></div>
            </div>
            <h3 className="text-stone-500 font-medium mb-1 text-sm">Active Tables</h3>
            <div className="text-2xl lg:text-3xl font-bold text-stone-800">{stats?.active_tables || 0} / {stats?.total_tables || 0}</div>
            <div className="text-stone-500 text-xs mt-1 font-medium">{stats?.total_tables ? Math.round((stats.active_tables / stats.total_tables) * 100) : 0}% Occupancy</div>
         </div>
         <div className="bg-orange-500 p-6 rounded-2xl shadow-md shadow-orange-500/20 text-white flex flex-col justify-center relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><ChefHat size={20} className="text-white" /></div>
                </div>
                <h3 className="text-orange-100 font-medium mb-1 text-sm">Kitchen Queue</h3>
                <div className="text-2xl lg:text-3xl font-bold">{(stats?.pending_kots || 0) + (stats?.preparing_kots || 0)}</div>
                <div className="text-orange-100 text-xs mt-1 font-medium">{stats?.ready_kots || 0} ready to serve</div>
             </div>
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-400 rounded-full opacity-50 blur-xl"></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Charts Area */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">
            {/* Revenue by Order */}
            <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-stone-100">
                <h3 className="text-lg lg:text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-orange-500" /> Revenue by Order
                </h3>
                <div className="h-[250px] lg:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="revenue" name="Total (incl. tax)" fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="base" name="Base" fill="#fed7aa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* KOT Status Distribution */}
            {kotData.length > 0 && (
                <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-stone-100">
                    <h3 className="text-lg lg:text-xl font-bold text-stone-800 mb-6">Kitchen Status</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={kotData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {kotData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>

        {/* Recent Orders Sidebar */}
        <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 h-full">
                <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <AlertCircle size={20} className="text-orange-500" /> Recent Orders
                </h3>
                <div className="flex flex-col gap-4">
                    {recentOrders.length === 0 ? (
                        <p className="text-stone-400 text-sm text-center py-8">No orders yet</p>
                    ) : (
                        recentOrders.map(order => (
                            <div key={order.id} className={`p-4 rounded-xl border flex flex-col gap-1 transition-all hover:shadow-md cursor-pointer ${
                                order.status === 'kitchen' ? 'bg-orange-50 border-orange-100' :
                                order.status === 'served' ? 'bg-green-50 border-green-100' :
                                order.status === 'paid' ? 'bg-blue-50 border-blue-100' :
                                'bg-stone-50 border-stone-100'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        order.status === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                                        order.status === 'served' ? 'bg-green-100 text-green-700' :
                                        order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                                        'bg-stone-100 text-stone-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                    <span className="text-stone-800 font-bold text-sm">₹{(order.total_amount + order.tax_amount).toFixed(0)}</span>
                                </div>
                                <p className="text-sm font-semibold leading-tight text-stone-800">
                                    Order #{order.id} • Table {order.table_id}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
