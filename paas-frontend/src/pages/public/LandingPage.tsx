import { Navbar } from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";


export const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

            {/* 1. Navbar Importado */}
            <Navbar />

            {/* 2. HERO SECTION */}
            <main className="mx-auto max-w-7xl px-6 pt-20 pb-32 lg:pt-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* COLUMNA IZQUIERDA: Texto y Llamada a la Acción */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Plataforma Educativa v1.0
                        </div>

                        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
                            De Docker Compose a <span className="text-blue-600">Kubernetes</span> sin complejidad.
                        </h1>

                        <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                            Sube tu archivo <code className="bg-slate-200 px-1 py-0.5 rounded text-sm font-mono text-slate-800">docker-compose.yml</code>.
                            Nosotros generamos los manifiestos, el Ingress y las políticas de red automáticamente.
                            Diseñado para aprender haciendo.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            {/* 3. EVENTOS ONCLICK EN LOS BOTONES */}
                            <Button
                                size="lg"
                                onClick={() => navigate("/labs")}
                                className="bg-blue-600 text-white hover:bg-blue-700 h-12 px-8 rounded-lg shadow-lg shadow-blue-200 transition-all font-semibold"
                            >
                                Empezar Laboratorio
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate("/docs")}
                                className="h-12 px-8 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium"
                            >
                                <FileText className="mr-2 h-4 w-4 text-slate-500" />
                                Leer documentación
                            </Button>
                        </div>


                        <div className="pt-8 border-t border-slate-200 flex gap-6 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span>Kubernetes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span>Docker</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span>Helm</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Visual Técnico (Ventana de Código) */}
                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">

                        {/* Efecto de Fondo (Glow) */}
                        <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"></div>
                        <div className="absolute -bottom-12 -left-12 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl"></div>

                        {/* La Ventana del IDE */}
                        <div className="relative rounded-2xl bg-[#0F172A] shadow-2xl border border-slate-800 overflow-hidden">

                            {/* Barra de Título */}
                            <div className="flex items-center justify-between border-b border-slate-800 bg-[#1E293B]/50 px-4 py-3">
                                <div className="flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="ml-4 text-xs font-mono text-slate-400">docker-compose.yml</span>
                                <div className="w-80"></div> {/* Espaciador */}
                            </div>

                            {/* Contenido del Código */}
                            <div className="p-6 overflow-x-auto">
                                <pre className="font-mono text-sm leading-relaxed">
                                    <code className="block text-slate-300">
                                        <span className="text-purple-400">version:</span> <span className="text-green-400">"3.8"</span>
                                    </code>
                                    <code className="block text-slate-300 mt-2">
                                        <span className="text-purple-400">services:</span>
                                    </code>
                                    <code className="block text-slate-300 pl-4">
                                        <span className="text-blue-400">front:</span> <span className="text-slate-500"># Frontend React</span>
                                    </code>
                                    <code className="block text-slate-300 pl-8">
                                        <span className="text-sky-400">image:</span> my-app:latest
                                    </code>
                                    <code className="block text-slate-300 pl-8">
                                        <span className="text-sky-400">ports:</span>
                                    </code>
                                    <code className="block text-slate-300 pl-12">
                                        - <span className="text-green-400">"80:80"</span>
                                    </code>

                                    <code className="block text-slate-300 pl-4 mt-2">
                                        <span className="text-blue-400">db:</span> <span className="text-slate-500"># Postgres DB</span>
                                    </code>
                                    <code className="block text-slate-300 pl-8">
                                        <span className="text-sky-400">image:</span> postgres:14
                                    </code>
                                    <code className="block text-slate-300 pl-8">
                                        <span className="text-sky-400">environment:</span>
                                    </code>
                                    <code className="block text-slate-300 pl-12">
                                        - <span className="text-green-400">POSTGRES_DB=mydb</span>
                                    </code>
                                </pre>
                            </div>

                            {/* Tarjeta Flotante "Status" */}
                            <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur border border-slate-200 animate-bounce delay-1000">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Status</p>
                                    <p className="text-xs font-bold text-slate-900">Valid & Deployed</p>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </main>

            {/* --- SECCIÓN LABORATORIOS (NUEVA) --- */}
            <section className="bg-slate-50 py-24 border-t border-slate-200">
                <div className="mx-auto max-w-7xl px-6">

                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Aprende con Laboratorios</h2>
                        <p className="text-slate-500 mt-2 text-lg">Guías paso a paso diseñadas para aprender.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">

                        {/* Card 1: Básico */}
                        <div className="bg-white rounded-xl p-8 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                            <span className="inline-block text-xs font-bold text-blue-600 mb-4 uppercase tracking-wider">Básico</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Hola Mundo en K8S</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Despliega un servidor Nginx simple y aprende sobre pods, servicios y exposición básica.
                            </p>
                        </div>

                        {/* Card 2: Intermedio */}
                        <div className="bg-white rounded-xl p-8 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
                            <span className="inline-block text-xs font-bold text-purple-600 mb-4 uppercase tracking-wider">Intermedio</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">Arquitectura Three-Tier</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Conecta un Frontend React con Backend Java y Postgres. Aprende sobre Networking interno.
                            </p>
                        </div>

                        {/* Card 3: Avanzado */}
                        <div className="bg-white rounded-xl p-8 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group">
                            <span className="inline-block text-xs font-bold text-orange-600 mb-4 uppercase tracking-wider">Avanzado</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">Persistencia de Datos</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                Gestión de volúmenes, PVCs y StorageClasses en StatefulSets para bases de datos reales.
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </div>

    );


};