import { create } from 'zustand';

interface CartItem {
  id: number;
  name: string;
  price: number;
  is_veg: boolean;
  qty: number;
  special_instructions?: string;
}

interface CartState {
  items: CartItem[];
  tableId: number | null;
  setTableId: (id: number) => void;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  updateQty: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  setSpecialInstructions: (id: number, instructions: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTax: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  setTableId: (id) => set({ tableId: id }),
  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.id === item.id);
    if (existing) {
      return { items: state.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) };
    }
    return { items: [...state.items, { ...item, qty: 1 }] };
  }),
  updateQty: (id, delta) => set((state) => {
    const updated = state.items.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }).filter(i => i.qty > 0);
    return { items: updated };
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  setSpecialInstructions: (id, instructions) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, special_instructions: instructions } : i)
  })),
  clearCart: () => set({ items: [], tableId: null }),
  getTotal: () => get().items.reduce((acc, i) => acc + i.price * i.qty, 0),
  getTax: () => Math.round(get().getTotal() * 0.05 * 100) / 100,
  getGrandTotal: () => get().getTotal() + get().getTax(),
  getItemCount: () => get().items.reduce((acc, i) => acc + i.qty, 0),
}));
