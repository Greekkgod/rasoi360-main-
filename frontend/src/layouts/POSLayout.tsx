import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function POSLayout() {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || user?.role !== 'Waiter' && user?.role !== 'Cashier' && user?.role !== 'Admin') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-50">
                <div className="text-center">
                    <h1 className="mb-4 text-3xl font-bold">POS Access Required</h1>
                    <p className="text-zinc-400">Please login with a Waiter or Cashier account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 text-zinc-900">
            {/* POS Sidebar Stub */}
            <nav className="w-24 border-r bg-white flex flex-col items-center py-6 gap-6 shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">R</div>
                {/* Menu Icons will go here */}
            </nav>
            
            {/* Main Application Area */}
            <main className="flex-1 overflow-hidden relative">
                 {/* Topbar Stub */}
                 <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
                     <h2 className="text-xl font-semibold">POS Dashboard</h2>
                     <div className="flex items-center gap-3 font-medium text-zinc-600">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">Logged in as {user.name}</span>
                     </div>
                 </header>
                 
                 {/* Outlet for POS routes (Grid, Cart, Tables) */}
                 <div className="h-[calc(100vh-4rem)] overflow-auto bg-zinc-50 p-6">
                    <Outlet />
                 </div>
            </main>
        </div>
    );
}
