import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-primary">
        ¡PaaS Core Frontend Listo! 🚀
      </h1>

      {/* Este componente invisible permite mostrar las notificaciones flotantes luego */}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;