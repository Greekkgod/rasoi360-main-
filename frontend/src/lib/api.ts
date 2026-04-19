import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ─────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: silent refresh on 401 ──────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and not on auth endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('http://localhost:8000/auth/refresh', {
          refresh_token: refreshToken,
        });
        const newToken = data.access_token;
        localStorage.setItem('access_token', newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- Types ---
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  image_url: string | null;
  category_id: number;
  station_id: number | null;
}

export interface KitchenStation {
    id: number;
    name: string;
    is_active: boolean;
}

// ... rest of interfaces

// --- Stations ---
export const fetchStations = () => api.get<KitchenStation[]>('/kots/stations').then(r => r.data);
export const createStation = (data: { name: string }) => api.post('/kots/stations', data).then(r => r.data);

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
  user_id: number | null;
  status: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  discount_type: string | null;
  final_total: number;
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

// --- Auth ---
export const apiLogin = (identifier: string, password: string) =>
  api.post('/auth/login', { identifier, password }).then(r => r.data);

export const apiRefresh = (refreshToken: string) =>
  api.post('/auth/refresh', { refresh_token: refreshToken }).then(r => r.data);

export const apiLogout = (refreshToken: string) =>
  api.post('/auth/logout', { refresh_token: refreshToken }).then(r => r.data);

export const apiGetMe = () =>
  api.get('/auth/me').then(r => r.data);

export const apiRegister = (data: { restaurant_name: string; admin_full_name: string; email: string; phone_number: string; password: string }) =>
  api.post('/auth/register', data).then(r => r.data);

// --- Menu ---
export const fetchMenu = () => api.get<Category[]>('/menu/').then(r => r.data);
export const fetchPublicMenu = (slug: string) => api.get<Category[]>(`/menu/public/${slug}`).then(r => r.data);
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
export const createOrder = (data: { table_id: number; user_id: number | null; items: { menu_item_id: number; quantity: number; special_instructions?: string }[] }) =>
  api.post('/orders/', data).then(r => r.data);
export const updateOrderStatus = (id: number, status: string) =>
  api.patch<Order>(`/orders/${id}/status`, { status }).then(r => r.data);

export const applyOrderDiscount = (id: number, data: { discount_amount: number; discount_type: string }) =>
  api.post<Order>(`/orders/${id}/discount`, data).then(r => r.data);

// --- KOTs ---
export const fetchActiveKots = () => api.get<KOT[]>('/kots/').then(r => r.data);
export const updateKotStatus = (id: number, status: string) =>
  api.patch(`/kots/${id}/status`, { status }).then(r => r.data);

// --- Stats ---
export const fetchDashboardStats = () => api.get<DashboardStats>('/stats/dashboard').then(r => r.data);

// --- Payments ---
export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: string;
  status: string;
}

export const createPayment = (data: { order_id: number; amount: number; method: string }) =>
  api.post<Payment>('/payments/', data).then(r => r.data);

export const downloadOrderInvoicePdf = (orderId: number) => 
  api.get(`/invoices/order/${orderId}/pdf`, { responseType: 'blob' })
    .then(r => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    });

// --- Platform Admin ---
export interface PlatformRestaurant {
  id: number;
  name: string;
  slug: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
}

export const fetchAllRestaurants = () => api.get<PlatformRestaurant[]>('/platform/restaurants').then(r => r.data);
export const updateRestaurantStatus = (id: number, data: { subscription_status: string; extend_trial_days?: number }) => 
  api.patch<PlatformRestaurant>(`/platform/restaurants/${id}/status`, data).then(r => r.data);

export default api;
