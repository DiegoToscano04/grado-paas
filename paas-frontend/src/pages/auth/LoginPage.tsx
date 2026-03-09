import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore"; // <--- Apuntando a nuestro Store real
import toast from "react-hot-toast"; // <--- Para las notificaciones

export const LoginPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Llamamos a la función login de nuestro store que habla con Java
            await login(email, password);
            toast.success('¡Iniciaste sesión con éxito!');

            // Redirigimos al inicio. 
            // App.tsx se encargará de ver qué rol tiene y enviarlo al Dashboard o al Admin Console.
            navigate("/");
        } catch (err) {
            toast.error("Credenciales inválidas o usuario deshabilitado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden font-sans">
            <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-white h-full relative z-10">
                <div
                    className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <Cloud className="h-8 w-8 text-blue-600 fill-blue-50" />
                    <span>PaaS Core Education</span>
                </div>
                <div className="mx-auto w-full max-w-[380px] space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Bienvenido de nuevo
                        </h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Ingresa tus credenciales institucionales para acceder.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-semibold">Correo Institucional</Label>
                            <Input
                                id="email"
                                placeholder="estudiante@uis.edu.co"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 border-slate-200 focus-visible:ring-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-700 font-semibold">Contraseña</Label>
                                <span
                                    className="text-xs font-medium text-slate-500 hover:text-blue-600 hover:underline cursor-pointer"
                                    onClick={() => navigate("/forgot-password")}
                                >
                                    ¿Olvidaste tu contraseña?
                                </span>
                            </div>
                            <Input
                                id="password"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 border-slate-200 focus-visible:ring-black"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-black hover:bg-slate-800 text-white font-bold rounded-lg shadow-lg shadow-black/10 transition-all text-base mt-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    Iniciar Sesión
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                    <div className="text-center text-sm text-slate-500">
                        ¿No tienes cuenta?{" "}
                        <span className="font-bold text-slate-900 hover:underline cursor-pointer" onClick={() => navigate("/register")}>
                            Regístrate con tu código
                        </span>
                    </div>
                </div>
                <div className="text-xs text-slate-400">
                    © 2026 PaaS Core Education. Todos los derechos reservados.
                </div>
            </div>
            {/* --- COLUMNA DERECHA IGUAL QUE EN TU CÓDIGO --- */}
            <div className="hidden lg:flex relative bg-[#0B0C15] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]"></div>
                <div className="relative z-10 w-[480px] rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <div className="flex gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-[#27C93F]"></div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
                            SYSTEM STATUS
                        </div>
                    </div>
                    <div className="space-y-3 font-mono text-xs leading-relaxed">
                        <div className="flex gap-4">
                            <span className="text-slate-600 w-4 text-right">1</span>
                            <div><span className="text-blue-400">deployment.apps/backend</span><span className="text-emerald-400 ml-2">created</span></div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-slate-600 w-4 text-right">2</span>
                            <div><span className="text-blue-400">service/db-internal</span><span className="text-emerald-400 ml-2">configured</span></div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-slate-600 w-4 text-right">3</span>
                            <div><span className="text-purple-400">ingress.networking/main</span><span className="text-emerald-400 ml-2">active</span></div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <span className="text-slate-600 w-4 text-right"></span>
                            <span className="text-slate-300">-- Building architecture... <span className="animate-pulse">Done</span></span>
                        </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 bg-white p-3 pr-6 rounded-lg shadow-xl flex items-center gap-3 animate-bounce delay-700">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATUS</p>
                            <p className="text-xs font-bold text-slate-900">Deployed Successfully</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};