import { create } from 'zustand';
import api from '@/lib/api';

interface User {
    id: number;
    name: string;
    role: 'Admin' | 'Waiter' | 'Chef' | 'Cashier' | 'Customer';
    restaurant_id?: number;
    is_superuser: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isHydrating: boolean;

    /** Used by the dev role switcher — sets user state directly without tokens. */
    login: (user: User) => void;
    logout: () => Promise<void>;

    /** Real JWT login — calls POST /auth/login, stores tokens + user. */
    loginWithCredentials: (identifier: string, password: string) => Promise<void>;

    /** Exchanges refresh token for a new access token. */
    refreshAccessToken: () => Promise<string | null>;

    /** On app load, reads localStorage and calls GET /auth/me to restore session. */
    hydrateFromToken: () => Promise<void>;
}

function mapRoleName(role: string): User['role'] {
    const lower = role.toLowerCase();
    if (lower === 'admin') return 'Admin';
    if (lower === 'waiter') return 'Waiter';
    if (lower === 'chef') return 'Chef';
    if (lower === 'cashier') return 'Cashier';
    return 'Customer';
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isHydrating: true,

    // Dev switcher login — sets user state directly, no tokens
    login: (user: User) => {
        set({ user, isAuthenticated: true });
    },

    logout: async () => {
        const { refreshToken } = get();
        try {
            if (refreshToken) {
                await api.post('/auth/logout', { refresh_token: refreshToken });
            }
        } catch {
            // Logout should always succeed on the client side
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
        });
    },

    loginWithCredentials: async (identifier: string, password: string) => {
        const response = await api.post('/auth/login', { identifier, password });
        const { access_token, refresh_token, user: userData } = response.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        set({
            accessToken: access_token,
            refreshToken: refresh_token,
            user: {
                id: userData.id,
                name: userData.full_name,
                role: mapRoleName(userData.role),
                restaurant_id: userData.restaurant_id,
                is_superuser: userData.is_superuser,
            },
            isAuthenticated: true,
        });
    },

    refreshAccessToken: async () => {
        const refreshToken = get().refreshToken || localStorage.getItem('refresh_token');
        if (!refreshToken) return null;

        try {
            const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
            const { access_token } = response.data;

            localStorage.setItem('access_token', access_token);
            set({ accessToken: access_token });
            return access_token;
        } catch {
            // Refresh failed — clear everything
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
            });
            return null;
        }
    },

    hydrateFromToken: async () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (!accessToken) {
            set({ isHydrating: false });
            return;
        }

        set({ accessToken, refreshToken });

        try {
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const userData = response.data;
            set({
                user: {
                    id: userData.id,
                    name: userData.full_name,
                    role: mapRoleName(userData.role),
                    restaurant_id: userData.restaurant_id,
                    is_superuser: userData.is_superuser,
                },
                isAuthenticated: true,
                isHydrating: false,
            });
        } catch {
            // Access token might be expired — try refresh
            const newToken = await get().refreshAccessToken();
            if (newToken) {
                try {
                    const response = await api.get('/auth/me', {
                        headers: { Authorization: `Bearer ${newToken}` },
                    });
                    const userData = response.data;
                    set({
                        user: {
                            id: userData.id,
                            name: userData.full_name,
                            role: mapRoleName(userData.role),
                            restaurant_id: userData.restaurant_id,
                            is_superuser: userData.is_superuser,
                        },
                        isAuthenticated: true,
                        isHydrating: false,
                    });
                } catch {
                    set({ isHydrating: false });
                }
            } else {
                set({ isHydrating: false });
            }
        }
    },
}));
