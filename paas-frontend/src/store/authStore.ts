import { create } from 'zustand';
import { api } from '../api/axios';
import type { User } from '../types/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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

    // --- NUEVA FUNCIÓN DE LOGIN ---
    login: async (email, password) => {
        // 1. Enviamos credenciales. Java responderá seteando la Cookie HttpOnly en el navegador
        await api.post('/auth/login', { email, password });

        // 2. Si fue exitoso, recargamos el usuario llamando al endpoint /me
        await get().checkAuth();
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