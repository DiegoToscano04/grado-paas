import { Button } from "@/components/ui/button";
import { Cloud, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore"; // <--- Importamos el estado global

export const Navbar = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore(); // <--- Verificamos si hay sesión

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                {/* GRUPO IZQUIERDA: Logo + Navegación */}
                <div className="flex items-center gap-10">
                    <div
                        className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        <Cloud className="h-8 w-8 text-blue-600 fill-blue-50" />
                        <span>PaaS Core Education</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        {/* Cambiamos las <a> por botones invisibles que usan navigate */}
                        <button onClick={() => navigate("/docs")} className="hover:text-blue-600 transition-colors">Documentación</button>
                        <button onClick={() => navigate("/labs")} className="hover:text-blue-600 transition-colors">Laboratorios</button>
                    </div>
                </div>

                {/* GRUPO DERECHA: Botones de Acción */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        /* Si está logueado, botón directo al dashboard */
                        <Button
                            className="bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 rounded-lg px-6 font-medium"
                            onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard')}
                        >
                            Ir al Dashboard
                        </Button>
                    ) : (
                        /* Si NO está logueado, mostramos Login y Registro*/
                        <>
                            <Button
                                variant="ghost"
                                className="hidden md:flex text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-medium"
                                onClick={() => navigate("/login")}
                            >
                                Acceder
                            </Button>

                            <Button className="bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 rounded-lg px-6 font-medium"
                                onClick={() => navigate("/register")}>
                                Crear Cuenta
                            </Button>
                        </>
                    )}

                    <button className="md:hidden text-slate-600">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

            </div>
        </nav>
    );
};