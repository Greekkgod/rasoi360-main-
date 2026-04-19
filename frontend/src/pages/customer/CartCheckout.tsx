import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Receipt, CheckCircle2, Loader2, Plus, Minus, Trash2, AlertTriangle, Store } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { createOrder } from '@/lib/api';

export default function CartCheckout() {
    const navigate = useNavigate();
    const [isPlacing, setIsPlacing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [paymentMode, setPaymentMode] = useState('counter');

    const { items, tableId, updateQty, removeItem, getTotal, getTax, getGrandTotal, clearCart } = useCartStore();
    const user = useAuthStore(state => state.user);

    const handlePlaceOrder = async () => {
        if (items.length === 0 || !tableId) return;
        setIsPlacing(true);
        try {
            await createOrder({
                table_id: tableId,
                user_id: user?.id ?? null,
                items: items.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.qty,
                    special_instructions: item.special_instructions || instructions || undefined,
                })),
                payment_mode: paymentMode,
            });
            setOrderSuccess(true);
            clearCart();
            setTimeout(() => {
                navigate('/');
            }, 2500);
        } catch (err) {
            console.error('Order failed:', err);
            setIsPlacing(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 max-w-lg mx-auto h-[60vh]">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">Order Placed!</h2>
                <p className="text-stone-500 text-center">Your order has been sent to the kitchen. You'll be redirected shortly.</p>
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-lg mx-auto h-full">
            <div className="flex items-center gap-4 mb-4">
                <button 
                    onClick={() => navigate(-1)} 
                    disabled={isPlacing}
                    className="p-2 border border-stone-200 bg-white rounded-xl shadow-sm active:scale-95 disabled:opacity-50 transition-all text-stone-600"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-stone-800">Your Cart</h2>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">{items.length} items</span>
                </div>
            </div>

            {!tableId && items.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold text-amber-800 text-sm">No table selected</p>
                        <p className="text-amber-600 text-xs mt-1">Please scan the QR code on your table to link your order. Without a table, you won't be able to place your order.</p>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-stone-400">
                    <div className="w-20 h-20 border-2 border-dashed border-stone-300 rounded-full flex items-center justify-center">
                        <Receipt size={32} className="text-stone-300" />
                    </div>
                    <p className="font-medium">Your cart is empty</p>
                    <button onClick={() => navigate('/')} className="text-orange-600 font-bold text-sm uppercase tracking-wider">
                        Browse Menu
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm flex flex-col gap-4">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between items-start pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 border flex items-center justify-center p-[1px] ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                            <span className={`w-full h-full rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                        </span>
                                        <h4 className="font-bold text-stone-800">{item.name}</h4>
                                    </div>
                                    <p className="text-stone-500 text-sm mt-1">₹{item.price} × {item.qty} = ₹{item.price * item.qty}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden shadow-sm">
                                        <button onClick={() => { if (item.qty === 1) removeItem(item.id); else updateQty(item.id, -1); }} className="h-11 w-11 flex items-center justify-center font-bold text-stone-500 active:bg-stone-200 transition-colors">
                                            {item.qty === 1 ? <Trash2 size={16} className="text-red-400" /> : <Minus size={18}/>}
                                        </button>
                                        <span className="px-3 font-bold text-stone-800 bg-white h-11 flex items-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="h-11 w-11 flex items-center justify-center font-bold text-orange-600 active:bg-stone-200 transition-colors"><Plus size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-2">
                            <textarea 
                                placeholder="Add cooking instructions (e.g. less spicy, extra onions...)"
                                className="w-full border border-stone-200 bg-stone-50 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-colors min-h-[80px]"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* Bill Summary */}
                    <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm flex flex-col gap-3 text-stone-600 text-sm">
                        <h3 className="font-bold text-stone-800 text-base mb-1 flex items-center gap-2"><Receipt size={18}/> Bill Details</h3>
                        <div className="flex justify-between">
                            <span>Item Total</span>
                            <span className="font-medium text-stone-800">₹{getTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Taxes & Charges (5% GST)</span>
                            <span className="font-medium text-stone-800">₹{getTax().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-stone-100 pt-3 mt-1 text-base font-bold text-stone-900">
                            <span>To Pay</span>
                            <span>₹{getGrandTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm flex flex-col gap-3">
                        <h3 className="font-bold text-stone-800 text-base">Payment Method</h3>
                        <div 
                            onClick={() => setPaymentMode('counter')}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMode === 'counter' ? 'border-orange-500 bg-orange-50/30' : 'border-stone-100 bg-stone-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMode === 'counter' ? 'bg-orange-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                                    <Store size={20}/>
                                </div>
                                <div>
                                    <p className="font-bold text-stone-800">Pay at Counter</p>
                                    <p className="text-xs text-stone-500">Inform waiter or pay at the exit</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMode === 'counter' ? 'border-orange-600' : 'border-stone-300'}`}>
                                {paymentMode === 'counter' && <div className="w-3 h-3 bg-orange-600 rounded-full"></div>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={isPlacing || items.length === 0 || !tableId}
                            className="w-full bg-stone-900 shadow-xl shadow-stone-900/20 py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-lg active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all mb-4"
                        >
                            {isPlacing ? (
                                <>Processing... <Loader2 className="animate-spin" size={20}/></>
                            ) : (
                                <>Place Order • ₹{getGrandTotal().toFixed(2)} <CheckCircle2 size={20}/></>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
