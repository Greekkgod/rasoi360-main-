import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  AlertCircle, TrendingUp, RefreshCw, ChefHat,
  ShoppingBag, Armchair, IndianRupee, CreditCard, Banknote, Smartphone, X, CheckCircle2, Loader2
} from 'lucide-react';
import { fetchDashboardStats, fetchOrders, type DashboardStats, type Order } from '@/lib/api';

// -----------------------------------------------------------------------------
// 1. Types & Constants
// -----------------------------------------------------------------------------

// Order type is imported from @/lib/api

const KOT_COLORS = ['#3b82f6', '#f97316', '#22c55e'];

const STATUS_THEME: Record<string, { card: string; badgeBg: string; badgeText: string }> = {
  kitchen: { card: 'bg-orange-50 border-orange-100', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' },
  served: { card: 'bg-green-50 border-green-100', badgeBg: 'bg-green-100', badgeText: 'text-green-700' },
  paid: { card: 'bg-blue-50 border-blue-100', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' },
  default: { card: 'bg-stone-50 border-stone-100', badgeBg: 'bg-stone-100', badgeText: 'text-stone-700' },
};

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
  { id: 'upi', label: 'UPI', icon: Smartphone, color: 'violet', gradient: 'from-violet-500 to-violet-600' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
];

// -----------------------------------------------------------------------------
// 2. Sub-Components
// -----------------------------------------------------------------------------

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, isSpecial = false }: any) => {
  if (isSpecial) {
    return (
      <div className="bg-orange-500 p-6 rounded-2xl shadow-md shadow-orange-500/20 text-white flex flex-col justify-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon size={20} className="text-white" />
            </div>
          </div>
          <h3 className="text-orange-100 font-medium mb-1 text-sm">{title}</h3>
          <div className="text-2xl lg:text-3xl font-bold">{value}</div>
          <div className="text-orange-100 text-xs mt-1 font-medium">{subtext}</div>
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-400 rounded-full opacity-50 blur-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.bg}`}>
          <Icon size={20} className={colorClass.text} />
        </div>
      </div>
      <h3 className="text-stone-500 font-medium mb-1 text-sm">{title}</h3>
      <div className="text-2xl lg:text-3xl font-bold text-stone-800">{value}</div>
      {subtext && <div className="text-stone-500 text-xs mt-1 font-medium">{subtext}</div>}
    </div>
  );
};

/**
 * Individual Order Item for the Sidebar — now with "Receive Payment" button
 */
const OrderCard = ({ order, onPayClick }: { order: Order; onPayClick: (order: Order) => void }) => {
  const theme = STATUS_THEME[order.status] || STATUS_THEME.default;
  const total = (order.total_amount + order.tax_amount).toFixed(0);
  const canPay = order.status !== 'paid';

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:shadow-md ${theme.card}`}>
      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
          {order.status}
        </span>
        <span className="text-stone-800 font-bold text-sm">₹{total}</span>
      </div>
      <p className="text-sm font-semibold leading-tight text-stone-800">
        Order #{order.id} • Table {order.table_id}
      </p>
      {canPay && (
        <button
          onClick={() => onPayClick(order)}
          className="mt-1 w-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-2 px-3 rounded-lg transition-all shadow-sm shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30 flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <IndianRupee size={13} /> Receive Payment
        </button>
      )}
      {!canPay && (
        <div className="mt-1 w-full text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
          <CheckCircle2 size={13} /> Payment Received
        </div>
      )}
    </div>
  );
};

/**
 * Payment Modal with UPI / Cash / Card options
 */
const PaymentModal = ({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>('');
  
  const [discountVal, setDiscountVal] = useState<string>('');
  const [discountType, setDiscountType] = useState<string>('flat');
  const [localOrder, setLocalOrder] = useState<Order>(order);

  const baseTotal = localOrder.total_amount + localOrder.tax_amount;
  // If final_total is 0 internally, baseTotal is used.
  const finalPayable = localOrder.final_total > 0 ? localOrder.final_total : baseTotal;
  
  // Fallback remaining logic if payments aren't eagerly loaded into Order
  const remaining = finalPayable; 

  const amountToPay = partialAmount && !isNaN(Number(partialAmount)) 
    ? Math.min(Number(partialAmount), remaining) 
    : remaining;

  const handleApplyDiscount = async () => {
    if (!discountVal || isNaN(Number(discountVal))) return;
    setProcessing(true);
    try {
      const module = await import('@/lib/api');
      const updatedOrder = await module.applyOrderDiscount(Number(localOrder.id), {
        discount_amount: Number(discountVal),
        discount_type: discountType
      });
      setLocalOrder(updatedOrder);
      setDiscountVal('');
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) return;
    setProcessing(true);
    try {
      const module = await import('@/lib/api');
      const result = await module.createPayment({
        order_id: Number(localOrder.id),
        amount: amountToPay,
        method: selectedMethod,
      }) as any;
      
      if (result.order_status === 'paid') {
          setSuccess(true);
      } else {
          // It's a partial payment, just close and refresh
          onSuccess();
          onClose();
          return;
      }
      onSuccess(); // refresh parent for full pays too
    } catch (err) {
      console.error('Payment failed:', err);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
          <h3 className="text-lg font-bold">Receive Payment</h3>
          <p className="text-orange-100 text-sm mt-0.5">
            Order #{order.id} • Table {order.table_id}
          </p>
        </div>

        {/* Amount Display */}
        <div className="p-5 border-b border-stone-100 text-sm">
          <div className="bg-stone-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-stone-500">Base Amount</span>
              <span className="font-bold">₹{localOrder.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-stone-500">
              <span>Taxes (GST)</span>
              <span className="font-bold text-orange-600">₹{localOrder.tax_amount.toFixed(2)}</span>
            </div>
            
            {localOrder.discount_amount > 0 ? (
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-600">Discount Applied</span>
                <span className="font-bold text-emerald-600">-₹{localOrder.discount_amount.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex gap-2 mt-3 items-center">
                <input 
                  type="text" 
                  placeholder="Discount Amt" 
                  value={discountVal}
                  onChange={e => setDiscountVal(e.target.value)}
                  className="border p-1.5 rounded-lg w-24 outline-none text-xs" 
                />
                <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="border p-1.5 rounded-lg text-xs outline-none">
                  <option value="flat">₹ Flat</option>
                  <option value="percentage">% Percent</option>
                </select>
                <button onClick={handleApplyDiscount} className="bg-stone-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
                  Apply
                </button>
              </div>
            )}
            
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-stone-200">
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Final Payable</p>
              <div className="flex items-center gap-2">
                <IndianRupee size={22} className="text-orange-600" />
                <span className="text-3xl font-bold text-stone-800">₹{finalPayable.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
               <span className="text-stone-600 text-xs font-bold">Partial Payment (Optional):</span>
               <input 
                  type="number" 
                  placeholder={`Max ₹${remaining.toFixed(2)}`}
                  value={partialAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                  className="border border-stone-300 p-1.5 rounded-lg text-right w-28 text-sm outline-none focus:border-orange-500"
               />
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        {!success ? (
          <div className="p-5">
            <p className="text-sm font-semibold text-stone-700 mb-3">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    disabled={processing}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? `border-${method.color}-500 bg-${method.color}-50 shadow-md shadow-${method.color}-500/10 scale-[1.02]`
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                      }
                      ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    style={isSelected ? {
                      borderColor: method.id === 'cash' ? '#10b981' : method.id === 'upi' ? '#8b5cf6' : '#3b82f6',
                      backgroundColor: method.id === 'cash' ? '#ecfdf5' : method.id === 'upi' ? '#f5f3ff' : '#eff6ff',
                    } : {}}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? `bg-gradient-to-br ${method.gradient} text-white shadow-lg` : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <method.icon size={20} />
                    </div>
                    <span className={`text-sm font-bold ${isSelected ? 'text-stone-800' : 'text-stone-600'}`}>
                      {method.label}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${method.gradient} flex items-center justify-center shadow-sm`}>
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmPayment}
              disabled={!selectedMethod || processing}
              className={`w-full mt-5 py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-sm
                ${selectedMethod && !processing
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98]'
                  : 'bg-stone-300 cursor-not-allowed'
                }
              `}
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <IndianRupee size={16} />
                  Confirm Payment — ₹{amountToPay.toFixed(2)}
                </>
              )}
            </button>
          </div>
        ) : (
          /* Success State */
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h4 className="text-xl font-bold text-stone-800">Payment Successful!</h4>
            <p className="text-stone-500 text-sm mt-1 mb-4">
              ₹{amountToPay.toFixed(2)} received via {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
            </p>
            <button 
              onClick={() => {
                import('@/lib/api').then(module => {
                  module.downloadOrderInvoicePdf(Number(localOrder.id));
                });
              }}
              className="w-full mb-3 text-sm font-bold text-white bg-orange-600 py-3 rounded-xl shadow-md hover:bg-orange-700 transition flex items-center justify-center"
            >
              Download GST Invoice PDF
            </button>
            <button 
              onClick={onClose}
              className="w-full text-sm font-bold text-stone-600 bg-stone-100 py-3 rounded-xl hover:bg-stone-200 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Loading Skeleton
 */
const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-stone-200 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 h-[350px] bg-stone-200 rounded-2xl" />
      <div className="h-[350px] bg-stone-200 rounded-2xl" />
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// 3. Main Dashboard Component
// -----------------------------------------------------------------------------

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        fetchDashboardStats(),
        fetchOrders().catch(() => [])
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // --- Data Transformations ---

  const revenueData = recentOrders.length > 0
    ? recentOrders.slice(0, 7).reverse().map((order) => ({
      name: `Order ${order.id}`,
      revenue: order.total_amount + order.tax_amount,
    }))
    : [{ name: 'No data', revenue: 0 }];

  const kotData = stats
    ? [
      { name: 'Pending', value: stats.pending_kots },
      { name: 'Preparing', value: stats.preparing_kots },
      { name: 'Ready', value: stats.ready_kots },
    ].filter(d => d.value > 0)
    : [];

  const occupancyRate = stats?.total_tables
    ? Math.round((stats.active_tables / stats.total_tables) * 100)
    : 0;

  // --- Setup Wizard Logic ---
  const hasTables = stats && stats.total_tables > 0;
  const hasOrders = stats && stats.total_orders > 0;
  const setupProgress = (hasTables ? 50 : 0) + (hasOrders ? 50 : 0);

  // --- Render ---

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-stone-800 tracking-tight">Overview</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-stone-500 bg-white px-3 py-1.5 rounded-xl border border-stone-100 shadow-sm text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live System Status
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-500 transition-colors disabled:opacity-50"
            aria-label="Refresh Dashboard"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Setup Wizard (Only show if not 100% setup) */}
      {setupProgress < 100 && (
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Welcome! Let's launch your restaurant.</h3>
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${setupProgress}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-orange-400">{setupProgress}%</span>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => navigate('/admin/tables')}
                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${hasTables ? 'bg-stone-800 text-stone-400' : 'bg-white text-stone-900 hover:bg-stone-100'}`}
                    >
                        {hasTables ? <CheckCircle2 size={16} className="text-emerald-500"/> : <div className="w-4 h-4 rounded-full border-2 border-stone-900"></div>}
                        1. Setup Tables
                    </button>
                    <button 
                        onClick={() => navigate('/admin/qrcodes')}
                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${hasOrders ? 'bg-stone-800 text-stone-400' : (hasTables ? 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-600/20' : 'bg-stone-800 text-stone-500 cursor-not-allowed')}`}
                    >
                        {hasOrders ? <CheckCircle2 size={16} className="text-emerald-500"/> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-50"></div>}
                        2. Get First Order
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${stats?.total_revenue?.toLocaleString() || 0}`}
          icon={IndianRupee}
          colorClass={{ bg: 'bg-green-50', text: 'text-green-600' }}
        />
        <StatCard
          title="Total Orders"
          value={stats?.total_orders || 0}
          subtext={`Avg ₹${stats?.avg_order_value?.toLocaleString() || 0}`}
          icon={ShoppingBag}
          colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
        />
        <StatCard
          title="Active Tables"
          value={`${stats?.active_tables || 0} / ${stats?.total_tables || 0}`}
          subtext={`${occupancyRate}% Occupancy`}
          icon={Armchair}
          colorClass={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
        />
        <StatCard
          title="Kitchen Queue"
          value={(stats?.pending_kots || 0) + (stats?.preparing_kots || 0)}
          subtext={`${stats?.ready_kots || 0} ready to serve`}
          icon={ChefHat}
          isSpecial={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Main Charts Area */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-w-0">

          {/* Revenue Area Chart */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-stone-100">
            <h3 className="text-lg lg:text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-500" /> Revenue Trend (Live)
            </h3>
            <div className="h-[250px] lg:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KOT Status Pie Chart */}
          {kotData.length > 0 && (
            <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-stone-100">
              <h3 className="text-lg lg:text-xl font-bold text-stone-800 mb-6">Kitchen Status</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={kotData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {kotData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={KOT_COLORS[index % KOT_COLORS.length]} />
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
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPayClick={(o) => setPaymentOrder(o)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Payment Modal */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}