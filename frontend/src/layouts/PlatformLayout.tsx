import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Shield, Building2, LogOut } from 'lucide-react';

export default function PlatformLayout() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    // Strict protection: Only superusers allowed
    if (!isAuthenticated || !user?.is_superuser) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-stone-900 flex flex-col text-stone-100">
            {/* Top Navigation */}
            <header className="bg-stone-950 border-b border-stone-800 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-600 p-2 rounded-lg">
                        <Shield size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">Rasoi360 Platform</h1>
                        <p className="text-xs font-medium text-orange-500 tracking-wider uppercase">Super Admin Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <nav className="flex items-center gap-2">
                        <div className="px-4 py-2 bg-stone-800 text-stone-200 rounded-lg text-sm font-medium flex items-center gap-2 cursor-default">
                            <Building2 size={16} /> Overview
                        </div>
                    </nav>

                    <div className="h-8 w-px bg-stone-800 mx-2"></div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-white">{user.name}</p>
                            <p className="text-xs text-stone-500">Platform Owner</p>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-bold hidden md:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-800/30 via-stone-900 to-stone-900 pointer-events-none"></div>
                <div className="relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
