import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

import CustomerLayout from '@/layouts/CustomerLayout';
import POSLayout from '@/layouts/POSLayout';
import KDSLayout from '@/layouts/KDSLayout';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import MenuEditor from '@/pages/admin/MenuEditor';
import StaffManager from '@/pages/admin/StaffManager';

import TableGrid from '@/pages/pos/TableGrid';
import OrderEntry from '@/pages/pos/OrderEntry';
import KDSKanban from '@/pages/kds/KDSKanban';

import DigitalMenu from '@/pages/customer/DigitalMenu';
import CartCheckout from '@/pages/customer/CartCheckout';

// Role switcher with auto-navigation
const DevLoginSwitcher = () => {
    const { user, login, logout } = useAuthStore();
    const navigate = useNavigate();

    const [isDevOpen, setIsDevOpen] = useState(true);

    const handleLogin = (userData: { id: number; name: string; role: 'Admin' | 'Waiter' | 'Chef' | 'Cashier' | 'Customer' }, targetPath: string) => {
        login(userData);
        navigate(targetPath);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const roleColor = {
        Admin: 'bg-violet-600',
        Waiter: 'bg-emerald-600',
        Chef: 'bg-red-600',
        Cashier: 'bg-blue-600',
        Customer: 'bg-orange-600',
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999]">
            {isDevOpen ? (
                <div className="bg-white border-2 border-stone-200 shadow-2xl rounded-2xl p-5 flex flex-col gap-3 w-72 text-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-stone-800 text-base">🔄 Switch Role</h3>
                        <button onClick={() => setIsDevOpen(false)} className="text-stone-400 hover:text-stone-600 text-xs font-medium px-2 py-1 rounded hover:bg-stone-100">
                            Minimize
                        </button>
                    </div>
                    
                    {user && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-bold ${roleColor[user.role] || 'bg-stone-600'}`}>
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                            Logged in as: {user.name} ({user.role})
                        </div>
                    )}
                    {!user && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 text-stone-500 text-xs font-bold">
                            <div className="w-2 h-2 rounded-full bg-stone-400"></div>
                            Not logged in (Guest)
                        </div>
                    )}

                    <div className="border-t border-stone-100 pt-3 flex flex-col gap-2">
                        <button 
                            onClick={() => handleLogin({ id: 1, name: 'Admin User', role: 'Admin' }, '/admin')} 
                            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-3 ${user?.role === 'Admin' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'}`}
                        >
                            <span className="text-lg">👔</span> Login as Admin
                            <span className="ml-auto text-[10px] opacity-60">/admin</span>
                        </button>
                        <button 
                            onClick={() => handleLogin({ id: 2, name: 'Waiter John', role: 'Waiter' }, '/pos/tables')} 
                            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-3 ${user?.role === 'Waiter' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                        >
                            <span className="text-lg">🍽️</span> Login as Waiter
                            <span className="ml-auto text-[10px] opacity-60">/pos</span>
                        </button>
                        <button 
                            onClick={() => handleLogin({ id: 3, name: 'Chef Gordon', role: 'Chef' }, '/kds')} 
                            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-3 ${user?.role === 'Chef' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}
                        >
                            <span className="text-lg">👨‍🍳</span> Login as Chef
                            <span className="ml-auto text-[10px] opacity-60">/kds</span>
                        </button>
                        <button 
                            onClick={handleLogout} 
                            className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl font-bold mt-1 border border-stone-200 hover:bg-stone-200 transition-colors flex items-center gap-3"
                        >
                            <span className="text-lg">🚪</span> Logout (Customer View)
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsDevOpen(true)} 
                    className={`h-12 px-4 ${user ? roleColor[user.role] || 'bg-stone-800' : 'bg-stone-800'} text-white rounded-full shadow-xl flex items-center justify-center gap-2 text-sm font-bold hover:scale-105 transition-transform`}
                >
                    🔄 {user?.role || 'Guest'}
                </button>
            )}
        </div>
    );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Facing Routes (Mobile First) */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<DigitalMenu />} />
          <Route path="cart" element={<CartCheckout />} />
        </Route>

        {/* POS / Staff Facing Routes */}
        <Route path="/pos" element={<POSLayout />}>
           <Route index element={<Navigate to="tables" replace />} />
           <Route path="tables" element={<TableGrid />} />
           <Route path="order/:tableId" element={<OrderEntry />} />
        </Route>

        {/* Kitchen Display System Routes */}
        <Route path="/kds" element={<KDSLayout />}>
           <Route index element={<KDSKanban />} />
        </Route>

        {/* Admin Command Center Routes */}
        <Route path="/admin" element={<AdminLayout />}>
           <Route index element={<AdminDashboard />} />
           <Route path="menu" element={<MenuEditor />} />
           <Route path="staff" element={<StaffManager />} />
        </Route>
      </Routes>
      
      <DevLoginSwitcher />
    </BrowserRouter>
  )
}
