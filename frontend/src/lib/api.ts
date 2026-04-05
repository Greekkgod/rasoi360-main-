import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// --- Types ---
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  image_url: string | null;
  category_id: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  menu_items: MenuItem[];
}

export interface RestaurantTable {
  id: number;
  table_number: string;
  status: string;
}

export interface KOTItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  special_instructions: string | null;
  menu_item: MenuItem | null;
}

export interface KOT {
  id: number;
  order_id: number;
  station_id: number | null;
  status: 'received' | 'preparing' | 'ready';
  created_at: string | null;
  items: KOTItem[];
}

export interface Order {
  id: number;
  table_id: number;
  user_id: number;
  status: string;
  total_amount: number;
  tax_amount: number;
  kots?: KOT[];
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  active_tables: number;
  total_tables: number;
  avg_order_value: number;
  pending_kots: number;
  preparing_kots: number;
  ready_kots: number;
}

// --- Menu ---
export const fetchMenu = () => api.get<Category[]>('/menu/').then(r => r.data);
export const createCategory = (data: { name: string; description?: string }) =>
  api.post('/menu/categories', data).then(r => r.data);
export const createMenuItem = (data: { name: string; price: number; is_veg: boolean; category_id: number }) =>
  api.post('/menu/items', data).then(r => r.data);
export const updateMenuItem = (id: number, data: Partial<MenuItem>) =>
  api.patch(`/menu/items/${id}`, data).then(r => r.data);
export const deleteMenuItem = (id: number) =>
  api.delete(`/menu/items/${id}`).then(r => r.data);

// --- Tables ---
export const fetchTables = () => api.get<RestaurantTable[]>('/tables/').then(r => r.data);
export const createTable = (data: { table_number: string }) =>
  api.post('/tables/', data).then(r => r.data);

// --- Orders ---
export const fetchOrders = () => api.get<Order[]>('/orders/').then(r => r.data);
export const fetchOrder = (id: number) => api.get<Order>(`/orders/${id}`).then(r => r.data);
export const createOrder = (data: { table_id: number; user_id: number; items: { menu_item_id: number; quantity: number; special_instructions?: string }[] }) =>
  api.post('/orders/', data).then(r => r.data);
export const updateOrderStatus = (id: number, status: string) =>
  api.patch(`/orders/${id}/status`, { status }).then(r => r.data);

// --- KOTs ---
export const fetchActiveKots = () => api.get<KOT[]>('/kots/').then(r => r.data);
export const updateKotStatus = (id: number, status: string) =>
  api.patch(`/kots/${id}/status`, { status }).then(r => r.data);

// --- Stats ---
export const fetchDashboardStats = () => api.get<DashboardStats>('/stats/dashboard').then(r => r.data);

export default api;
