import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function KDSLayout() {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || user?.role !== 'Chef' && user?.role !== 'Admin') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-50">
                <div className="text-center">
                    <h1 className="mb-4 text-3xl font-bold">KDS Access Required</h1>
                    <p className="text-zinc-400">Please login with a Chef account to view KOTs.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen flex-col bg-zinc-900 text-zinc-100">
            {/* KDS Dark Mode Header */}
            <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-orange-500">Kitchen Display System</h2>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-green-400">WebSocket Connected</span>
                </div>
                <div className="text-sm font-medium text-zinc-400">
                    Logged in as <span className="text-white">{user.name}</span>
                </div>
            </header>
            
            {/* Main Application Area (Horizontal Scrolling Kanban) */}
            <main className="flex-1 overflow-x-auto p-6 flex gap-4">
                 <Outlet />
            </main>
        </div>
    );
}
