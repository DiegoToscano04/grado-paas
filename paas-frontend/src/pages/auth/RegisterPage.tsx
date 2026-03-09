import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, ArrowRight, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore"; // <--- Corregido al store real
import { api } from "@/api/axios"; // <--- Para hacer la petición a Java
import toast from "react-hot-toast"; // <--- Para las notificaciones

export const RegisterPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validación básica de contraseñas
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Enviar datos a Java (MS-01)
            await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                code: formData.code,
                password: formData.password
            });

            toast.success("¡Cuenta creada exitosamente!");

            // 2. Iniciar sesión automáticamente (Java nos dará la Cookie)
            await login(formData.email, formData.password);

            // 3. Redirigir al inicio (el Router sabrá dónde enviarnos)
            navigate("/");

        } catch (err: any) {
            // Si Java rechaza el registro (ej. correo duplicado), nos manda un texto
            const errorMessage = err.response?.data || "Error al registrar el usuario. Inténtalo de nuevo.";
            setError(typeof errorMessage === 'string' ? errorMessage : "Ocurrió un error inesperado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden font-sans bg-white">
            {/* --- COLUMNA IZQUIERDA (Formulario de Registro) --- */}
            <div className="flex flex-col p-8 md:p-10 lg:p-11 h-full overflow-y-auto">
                {/* Logo */}
                <div
                    className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight cursor-pointer mb-10"
                    onClick={() => navigate("/")}
                >
                    <Cloud className="h-8 w-8 text-blue-600 fill-blue-50" />
                    <span>PaaS Core Education</span>
                </div>

                <div className="mx-auto w-full max-w-[400px] space-y-6">                    <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Crear una cuenta
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Ingresa tus datos institucionales para obtener acceso a los recursos.
                    </p>
                </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 font-semibold">Nombre Completo</Label>
                            <Input
                                id="name"
                                placeholder="Ej. Juan Pérez"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-200 focus-visible:ring-black"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-slate-700 font-semibold">Código</Label>
                                <Input
                                    id="code"
                                    placeholder="2201..."
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                    className="h-11 border-slate-200 focus-visible:ring-black"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-semibold">Correo</Label>
                                <Input
                                    id="email"
                                    placeholder="@correo.uis.edu.co"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="h-11 border-slate-200 focus-visible:ring-black"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 font-semibold">Contraseña</Label>
                            <Input
                                id="password"
                                placeholder="Mínimo 8 caracteres"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-200 focus-visible:ring-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                placeholder="Repite tu contraseña"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="h-11 border-slate-200 focus-visible:ring-black"
                            />
                        </div>

                        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all text-base mt-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Registrarme
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-slate-500 pt-2">
                        ¿Ya tienes una cuenta?{" "}
                        <span
                            onClick={() => navigate("/login")}
                            className="font-bold text-slate-900 hover:underline cursor-pointer"
                        >
                            Inicia Sesión
                        </span>
                    </div>
                </div>
            </div>

            {/* --- COLUMNA DERECHA (Visual) --- */}
            <div className="hidden lg:flex relative bg-[#0B0C15] items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]"></div>
                <div className="relative z-10 w-[480px] rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <div className="flex gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-[#27C93F]"></div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">USER PROVISIONING</div>
                    </div>
                    <div className="space-y-3 font-mono text-xs leading-relaxed text-slate-300">
                        <div className="flex gap-4"><span className="text-slate-600 w-4 text-right">1</span><div><span className="text-purple-400">user.create</span>(<span className="text-orange-300">"student"</span>)</div></div>
                        <div className="flex gap-4"><span className="text-slate-600 w-4 text-right">2</span><div><span className="text-blue-400">quota.set_limit</span> <span className="text-slate-400">{'{'}</span> cpu: <span className="text-emerald-400">2.0</span>, ram: <span className="text-emerald-400">2048</span> <span className="text-slate-400">{'}'}</span></div></div>
                        <div className="flex gap-4"><span className="text-slate-600 w-4 text-right">3</span><div><span className="text-purple-400">namespace.init</span><span className="text-emerald-400 ml-2">ready</span></div></div>
                        <div className="flex gap-4 pt-4 border-t border-white/5 mt-4"><span className="text-slate-600 w-4 text-right"></span><span className="text-white animate-pulse">Waiting for registration...</span></div>
                    </div>
                    <div className="absolute -left-6 -bottom-6 bg-white p-3 pr-6 rounded-lg shadow-xl flex items-center gap-3 animate-bounce delay-1000">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><UserPlus className="h-5 w-5" /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACCESS</p><p className="text-xs font-bold text-slate-900">Student Role</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};