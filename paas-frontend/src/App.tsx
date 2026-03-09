import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <--- IMPORTAR

import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LandingPage } from './pages/public/LandingPage';
import { StudentDashboard } from './pages/dashboard/StudentDashboard'; // <--- IMPORTAR

const queryClient = new QueryClient();

// GUARDIA PARA ESTUDIANTES
const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'STUDENT') return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

// GUARDIA PARA ADMINS
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* RUTA PROTEGIDA DE ESTUDIANTE */}
          <Route path="/dashboard" element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          } />

          {/* RUTA PROTEGIDA DE ADMIN (Temporalmente en blanco) */}
          <Route path="/admin" element={
            <AdminRoute>
              <div className="p-10"><h1>Consola de Administrador (Próximamente)</h1></div>
            </AdminRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;