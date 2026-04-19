import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

import CustomerLayout from '@/layouts/CustomerLayout';
import POSLayout from '@/layouts/POSLayout';
import KDSLayout from '@/layouts/KDSLayout';
import AdminLayout from '@/layouts/AdminLayout';
import PlatformLayout from '@/layouts/PlatformLayout';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import MenuEditor from '@/pages/admin/MenuEditor';
import StaffManager from '@/pages/admin/StaffManager';
import { Login } from '@/pages/auth/Login';

import TableGrid from '@/pages/pos/TableGrid';
import OrderEntry from '@/pages/pos/OrderEntry';
import KDSKanban from '@/pages/kds/KDSKanban';

import DigitalMenu from '@/pages/customer/DigitalMenu';
import CartCheckout from '@/pages/customer/CartCheckout';

import PlatformDashboard from '@/pages/platform/PlatformDashboard';
import SaaSLanding from '@/pages/platform/SaaSLanding';

// Role switcher with auto-navigation
const DevLoginSwitcher = () => {
    const { user, loginWithCredentials, logout } = useAuthStore();
    const navigate = useNavigate();

    const [isDevOpen, setIsDevOpen] = useState(true);

    const handleLogin = async (email: string, targetPath: string) => {
        try {
            await loginWithCredentials(email, 'password123');
            navigate(targetPath);
        } catch (e) {
            console.error("Login failed via switcher", e);
            alert("Login failed. Check credentials.");
        }
    };

    const handleOwnerLogin = async () => {
         try {
            await loginWithCredentials('owner@rasoi360.com', 'master123');
            navigate('/platform');
        } catch (e) {
            console.error("Owner Login failed", e);
            alert("Login failed.");
        }
    }

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
                        <h3 className="font-bold text-stone-800 text-base">🔄 Dev Switcher</h3>
                        <button onClick={() => setIsDevOpen(false)} className="text-stone-400 hover:text-stone-600 text-xs font-medium px-2 py-1 rounded hover:bg-stone-100">
                            Min
                        </button>
                    </div>
                    
                    {user && (
                        <div className={`flex flex-col gap-1 px-3 py-2 rounded-xl text-white text-xs font-bold ${user.is_superuser ? 'bg-stone-900 shadow-lg shadow-stone-900/30' : roleColor[user.role] || 'bg-stone-600'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                {user.name} ({user.role})
                            </div>
                            {user.is_superuser ? (
                                <span className="text-[10px] text-orange-400 font-mono ml-4">PLATFORM OWNER</span>
                            ) : (
                                <span className="text-[10px] text-stone-200 font-mono ml-4">Tenant ID: {user.restaurant_id}</span>
                            )}
                        </div>
                    )}
                    {!user && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 text-stone-500 text-xs font-bold">
                            <div className="w-2 h-2 rounded-full bg-stone-400"></div>
                            Not logged in
                        </div>
                    )}

                    <div className="border-t border-stone-100 pt-3 flex flex-col gap-2">
                         <button 
                            onClick={handleOwnerLogin} 
                            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-3 ${user?.is_superuser ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/30' : 'bg-stone-50 text-stone-800 hover:bg-stone-200 border border-stone-300'}`}
                        >
                            <span className="text-lg">👑</span> Super Owner
                            <span className="ml-auto text-[10px] opacity-60">/platform</span>
                        </button>
                        <button 
                            onClick={() => handleLogin('admin@gourmet.com', '/admin')} 
                            className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-3 ${user?.role === 'Admin' && !user.is_superuser ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'}`}
                        >
                            <span className="text-lg">👔</span> Gourmet Admin
                            <span className="ml-auto text-[10px] opacity-60">/admin</span>
                        </button>
                        <button 
                            onClick={() => handleLogout()} 
                            className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl font-bold mt-1 border border-stone-200 hover:bg-stone-200 transition-colors flex items-center gap-3"
                        >
                            <span className="text-lg">🚪</span> Logout
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsDevOpen(true)} 
                    className={`h-12 px-4 ${user ? (user.is_superuser ? 'bg-stone-900' : roleColor[user.role]) : 'bg-stone-800'} text-white rounded-full shadow-xl flex items-center justify-center gap-2 text-sm font-bold hover:scale-105 transition-transform`}
                >
                    🔄 {user?.is_superuser ? 'Owner' : user?.role || 'Guest'}
                </button>
            )}
        </div>
    );
};

export default function App() {
  const { hydrateFromToken, isHydrating } = useAuthStore();

  useEffect(() => {
    hydrateFromToken();
  }, [hydrateFromToken]);

  // Show loading state while checking for existing session
  if (isHydrating) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-600/30 animate-pulse">R</div>
          <p className="text-stone-400 text-sm font-medium">Loading Rasoi360...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public SaaS Route */}
        <Route path="/" element={<Navigate to="/login" replace />} /> {/* Placeholder until SaaS landing is built */}

        {/* Tenant Public Digital Menu Route */}
        <Route path="/:slug" element={<CustomerLayout />}>
          <Route index element={<DigitalMenu />} />
          <Route path="cart" element={<CartCheckout />} />
        </Route>
        
        <Route path="/login" element={<Login />} />

        {/* --- SUPER ADMIN ONLY --- */}
        <Route path="/platform" element={<PlatformLayout />}>
           <Route index element={<PlatformDashboard />} />
        </Route>

        {/* --- TENANT SPECIFIC ROUTES --- */}
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
