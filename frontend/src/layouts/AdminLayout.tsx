import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Menu as MenuIcon, Users, X, Menu as Hamburger, LayoutGrid, QrCode } from 'lucide-react';

export default function AdminLayout() {
    const { user, isAuthenticated } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!isAuthenticated || user?.role !== 'Admin') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-stone-50 text-stone-900">
                <div className="text-center">
                    <h1 className="mb-4 text-3xl font-bold">Admin Portal</h1>
                    <p className="text-stone-500">Please login with an Administrator account.</p>
                </div>
            </div>
        );
    }

    const navClass = ({ isActive }: { isActive: boolean }) => 
        `px-4 py-3 rounded-md font-medium flex items-center gap-3 transition-colors ${
            isActive 
                ? 'bg-orange-50 text-orange-700' 
                : 'text-stone-600 hover:bg-stone-50 cursor-pointer'
        }`;

    return (
        <div className="flex h-screen w-screen bg-stone-100 text-stone-900 overflow-hidden">
            {/* Sidebar Desktop & Mobile Drawer */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r bg-white flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-'-translate-x-full'}`}>
                <div className="h-16 border-b flex items-center justify-between px-6">
                    <h2 className="text-lg font-bold text-orange-600">Rasoi360 Admin</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-2">
                   <NavLink to="/admin" end className={navClass} onClick={() => setIsSidebarOpen(false)}>
                       <LayoutDashboard size={18} />
                       Dashboard
                   </NavLink>
                   <NavLink to="/admin/menu" className={navClass} onClick={() => setIsSidebarOpen(false)}>
                       <MenuIcon size={18} />
                       Menu Management
                   </NavLink>
                   <NavLink to="/admin/tables" className={navClass} onClick={() => setIsSidebarOpen(false)}>
                       <LayoutGrid size={18} />
                       Table Layout
                   </NavLink>
                   <NavLink to="/admin/qrcodes" className={navClass} onClick={() => setIsSidebarOpen(false)}>
                       <QrCode size={18} />
                       QR Codes
                   </NavLink>
                   <NavLink to="/admin/staff" className={navClass} onClick={() => setIsSidebarOpen(false)}>
                       <Users size={18} />
                       Staff Roles
                   </NavLink>
                </nav>
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            
            {/* Main Application Area */}
            <main className="flex-1 flex flex-col min-w-0">
                 <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-stone-500 hover:bg-stone-50 rounded-lg lg:hidden"
                        >
                            <Hamburger size={20} />
                        </button>
                        <h3 className="font-semibold text-stone-800 truncate">Command Center</h3>
                    </div>
                    <div className="text-sm font-medium text-stone-500 hidden sm:block">Admin: {user.name}</div>
                 </header>
                 <div className="flex-1 overflow-auto p-4 lg:p-8">
                    <Outlet />
                 </div>
            </main>
        </div>
    );
}
