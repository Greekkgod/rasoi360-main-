import { create } from 'zustand';

interface User {
    id: number;
    name: string;
    role: 'Admin' | 'Waiter' | 'Chef' | 'Cashier' | 'Customer';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    login: (user: User) => set({ user, isAuthenticated: true }),
    logout: () => set({ user: null, isAuthenticated: false }),
}));
