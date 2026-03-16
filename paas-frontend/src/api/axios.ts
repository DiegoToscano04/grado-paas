import axios from 'axios';

// Creamos una instancia configurada de Axios
export const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor para manejar errores globalmente (ej: si el token expira, sacar al usuario)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Si Java dice 401 o 403, significa que la sesión expiró o no tiene permisos
            // Aquí luego programaremos que se limpie el estado global y redirija al Login
            console.warn("Sesión expirada o acceso denegado");
        }
        return Promise.reject(error);
    }
);

export const apiK8s = axios.create({
    baseURL: '/api/k8s',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});