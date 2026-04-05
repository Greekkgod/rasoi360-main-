import { Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function CustomerLayout() {
    const navigate = useNavigate();
    const cartCount = useCartStore(state => state.getItemCount());

    return (
        <div className="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900">
            {/* Mobile First Header */}
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-600 text-white font-bold">R</div>
                    <span className="text-lg font-bold">Rasoi360</span>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2 text-stone-500 hover:bg-stone-50 rounded-full transition-colors">
                        <Bell size={20} />
                    </button>
                    
                    <div 
                        onClick={() => navigate('/cart')}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 relative cursor-pointer active:scale-95 transition-all"
                    >
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white font-bold ring-2 ring-white">
                                {cartCount}
                            </span>
                        )}
                        <ShoppingCart size={20} />
                    </div>
                </div>
            </header>
            
            <main className="flex-1 pb-20 p-4">
                 <Outlet />
            </main>
            
            <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
               <button className="w-full flex justify-center items-center gap-2 rounded-xl bg-stone-900 py-3 text-white font-medium hover:bg-stone-800 transition-colors">
                  Call Waiter
               </button>
            </div>
        </div>
    );
}
