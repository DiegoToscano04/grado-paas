import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

function App() {
  // Extraemos lo que necesitamos de nuestro estado global
  const { checkAuth, isAuthenticated, user, isLoading, logout } = useAuthStore();

  // useEffect se ejecuta apenas carga la página
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Si está cargando, mostramos un texto simple
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-xl font-semibold">Cargando aplicación...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900">

      {isAuthenticated ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center space-y-4">
          <h1 className="text-3xl font-bold text-green-600">¡Conectado exitosamente! ✅</h1>
          <p className="text-lg">Hola, <span className="font-bold text-primary">{user?.name}</span></p>
          <p className="text-sm text-gray-500">Tu rol en el sistema es: {user?.role}</p>

          <button
            onClick={logout}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-500">No hay sesión activa ❌</h1>
          <p className="text-gray-500">La cookie HttpOnly no está presente o expiró.</p>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}

export default App;