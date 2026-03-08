import { create } from 'zustand';
import { api } from '../api/axios';
import type { User } from '../types/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Inicia en true mientras preguntamos a Java si hay cookie

    // Esta función llama a Java para ver si la cookie es válida
    checkAuth: async () => {
        try {
            const response = await api.get('/auth/me');
            // Si Java responde 200 OK, guardamos el usuario
            set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            // Si Java responde 403 Forbidden (no hay cookie), limpiamos todo
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    // Función para cerrar sesión
    logout: async () => {
        try {
            await api.post('/auth/logout');
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error("Error al cerrar sesión", error);
        }
    }
}));