import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <--- IMPORTAR

import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LandingPage } from './pages/public/LandingPage';
import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { CreateProjectWizard } from './components/dashboard/CreateProjectWizard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { Cloud } from 'lucide-react';

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
    <>
      {/* ESTO SOLO SE VE EN CELULARES */}
      <div className="flex md:hidden h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
          <Cloud className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Pantalla muy pequeña</h2>
          <p className="text-slate-500 text-sm">
            PaaS Core Education es una herramienta de infraestructura avanzada.
            Por favor, accede desde una computadora portátil o de escritorio para una experiencia óptima.
          </p>
        </div>
      </div>

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

            {/* NUEVA RUTA PARA EL WIZARD */}
            <Route path="/dashboard/new" element={
              <StudentRoute>
                <CreateProjectWizard />
              </StudentRoute>
            } />

            {/* RUTA PROTEGIDA DE ADMIN (Temporalmente en blanco) */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </>
  );
}

export default App;