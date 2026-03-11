import { api } from '@/api/axios';
import Editor from '@monaco-editor/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Server, Database, Monitor, Box, Cpu, Cloud, CheckCircle2, UploadCloud, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

// --- MEJORA 1: SISTEMA DE ICONOS Y COLORES ---
const ICONS = {
    front: { icon: Monitor, color: "text-blue-600", bg: "bg-blue-50" },
    back: { icon: Cpu, color: "text-purple-600", bg: "bg-purple-50" },
    db: { icon: Database, color: "text-emerald-600", bg: "bg-emerald-50" },
    monolith: { icon: Box, color: "text-orange-500", bg: "bg-orange-50" }
};

const ARCHITECTURES = [
    {
        id: 'THREE_TIER', name: 'Three-Tier Architecture', desc: 'La arquitectura estándar: Frontend, API de Backend y Base de Datos independiente.',
        services: ['front', 'back', 'db'], type: 'compuesta', components: ['front', 'back', 'db']
    },
    {
        id: 'MONOLITH_DB', name: 'Monolith + Database', desc: 'Aplicación todo-en-uno (Server Side Rendering) con persistencia externa.',
        services: ['monolith', 'db'], type: 'compuesta', components: ['monolith', 'db']
    },
    {
        id: 'BACKEND_DB', name: 'Backend + Database', desc: 'Servicio de API o lógica de negocio que requiere almacenamiento persistente.',
        services: ['back', 'db'], type: 'compuesta', components: ['back', 'db']
    },
    {
        id: 'MONOLITH', name: 'Monolith', desc: 'App autónoma.',
        services: ['monolith'], type: 'standalone', components: ['monolith']
    },
    {
        id: 'FRONTEND_STANDALONE', name: 'Frontend', desc: 'Solo cliente web.',
        services: ['front'], type: 'standalone', components: ['front']
    },
    {
        id: 'BACKEND_STANDALONE', name: 'Backend', desc: 'Solo lógica/API.',
        services: ['back'], type: 'standalone', components: ['back']
    },
    {
        id: 'DB_STANDALONE', name: 'Database', desc: 'Solo persistencia.',
        services: ['db'], type: 'standalone', components: ['db']
    },
];

export const CreateProjectWizard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        architecture: '',
        name: '',
        description: '',
        dockerComposeContent: ''
    });

    // Controla si mostramos la zona de arrastrar archivo o el editor de código
    const [inputMode, setInputMode] = useState<'upload' | 'editor'>('upload');

    // Para mostrar el spinner en el botón mientras Java valida
    const [isValidating, setIsValidating] = useState(false);

    // Guardará la respuesta de Java (sea error o éxito)
    const [validationResult, setValidationResult] = useState<any>(null);

    // Función para leer el archivo subido de la computadora
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setFormData({ ...formData, dockerComposeContent: content });
            setInputMode('editor'); // Cambiamos al editor para que pueda ver/editar lo que subió
        };
        reader.readAsText(file);
    };

    // Busca qué arquitectura seleccionó en el Paso 1 para recordarle las etiquetas
    const selectedArchDetails = ARCHITECTURES.find(a => a.id === formData.architecture);
    const handleNextStep = () => setStep(step + 1);
    const handlePrevStep = () => setStep(step - 1);

    const handleValidation = async () => {
        setIsValidating(true);
        try {
            // Mandamos el JSON a Java
            const response = await api.post('/projects', {
                name: formData.name,
                description: formData.description,
                architecture: formData.architecture,
                dockerComposeContent: formData.dockerComposeContent
            });

            // Si llega aquí, es un 201 Created (ÉXITO)
            setValidationResult({ success: true, data: response.data });
            setStep(3); // Pasamos a la pantalla de éxito

        } catch (error: any) {
            // Si llega aquí, es un 400 Bad Request o 409 Conflict (ERROR)
            setValidationResult({
                success: false,
                message: error.response?.data || "Error desconocido en la validación"
            });
            setStep(3); // Pasamos a la pantalla de error
        } finally {
            setIsValidating(false);
        }
    };

    const formatError = (errorStr: string) => {
        const parts = errorStr.split(":");
        if (parts.length > 1) {
            return (
                <p>
                    <span className="font-semibold text-slate-900">{parts[0]}:</span>
                    <span className="text-red-600 font-bold ml-1">{parts.slice(1).join(":")}</span>
                </p>
            )
        }
        return <p>{errorStr}</p>;
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans animate-in fade-in duration-300">

            {/* NAVBAR EXCLUSIVO DEL WIZARD (Focus Mode) */}
            <nav className="w-full border-b border-slate-200 bg-white px-8 h-16 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight">
                    <Cloud className="h-8 w-8 text-blue-600 fill-blue-50" />
                    <span>PaaS Core Education</span>
                </div>
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-900 font-medium">
                    Cancelar
                </Button>
            </nav>

            <div className="flex-1 overflow-y-auto py-12">
                {/* STEPPER */}
                <div className="flex items-center justify-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors", step >= 1 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500")}>
                            {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
                        </div>
                        <span className={cn("text-sm font-semibold", step >= 1 ? "text-slate-900" : "text-slate-400")}>Arquitectura</span>

                        <div className={cn("w-12 h-px", step >= 2 ? "bg-emerald-500" : "bg-slate-200")}></div>

                        <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors", step >= 2 ? "bg-black text-white" : "bg-slate-200 text-slate-500")}>
                            {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : "2"}
                        </div>
                        <span className={cn("text-sm font-semibold", step >= 2 ? "text-slate-900" : "text-slate-400")}>Configuración</span>

                        <div className={cn("w-12 h-px", step >= 3 ? "bg-black" : "bg-slate-200")}></div>

                        <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors", step >= 3 ? "bg-black text-white" : "bg-slate-200 text-slate-500")}>
                            3
                        </div>
                        <span className={cn("text-sm font-semibold", step >= 3 ? "text-slate-900" : "text-slate-400")}>Despliegue</span>
                    </div>
                </div>

                {/* CONTENIDO DINÁMICO */}
                <div className="max-w-5xl mx-auto px-8 pb-20">

                    {/* --- PASO 1: SELECCIÓN DE ARQUITECTURA --- */}
                    {step === 1 && (
                        <div className="space-y-10 animate-in slide-in-from-right-4">
                            <div className="text-center space-y-3 mb-12">
                                <h2 className="text-4xl font-extrabold text-slate-900">Nuevo Proyecto</h2>
                                <p className="text-lg text-slate-500">Selecciona la arquitectura que define tu archivo <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 text-sm border border-slate-300">docker-compose.yml</code></p>
                            </div>

                            {/* Compuestas */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Arquitecturas Compuestas</h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {ARCHITECTURES.filter(a => a.type === 'compuesta').map((arch) => (
                                        <div
                                            key={arch.id}
                                            onClick={() => setFormData({ ...formData, architecture: arch.id })}
                                            className={cn(
                                                "bg-white p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                                                formData.architecture === arch.id ? "border-blue-600 ring-4 ring-blue-600/10 shadow-blue-100" : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            {/* RENDERIZADO DINÁMICO DE ICONOS Y COLORES */}
                                            <div className="flex gap-3 mb-5">
                                                {arch.components.map(comp => {
                                                    const IconData = ICONS[comp as keyof typeof ICONS];
                                                    const IconComponent = IconData.icon;
                                                    return (
                                                        <div key={comp} className={cn("p-2.5 rounded-lg", IconData.bg)}>
                                                            <IconComponent className={cn("h-6 w-6", IconData.color)} />
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <h4 className="text-lg font-bold text-slate-900 mb-2">{arch.name}</h4>
                                            <p className="text-sm text-slate-500 mb-6 min-h-[60px] leading-relaxed">{arch.desc}</p>

                                            <div className="pt-4 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Service Names Requeridos:</p>
                                                <div className="flex gap-2">
                                                    {arch.services.map(s => (
                                                        <span key={s} className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Standalone */}
                            <div className="pt-6">
                                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Componentes Standalone</h3>
                                <div className="grid md:grid-cols-4 gap-6">
                                    {ARCHITECTURES.filter(a => a.type === 'standalone').map((arch) => (
                                        <div
                                            key={arch.id}
                                            onClick={() => setFormData({ ...formData, architecture: arch.id })}
                                            className={cn(
                                                "bg-white p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                                                formData.architecture === arch.id ? "border-blue-600 ring-4 ring-blue-600/10" : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex gap-3 mb-4">
                                                {arch.components.map(comp => {
                                                    const IconData = ICONS[comp as keyof typeof ICONS];
                                                    const IconComponent = IconData.icon;
                                                    return (
                                                        <div key={comp} className={cn("p-2 rounded-lg", IconData.bg)}>
                                                            <IconComponent className={cn("h-5 w-5", IconData.color)} />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <h4 className="text-base font-bold text-slate-900 mb-1">{arch.name}</h4>
                                            <p className="text-xs text-slate-500 mb-4">{arch.desc}</p>
                                            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{arch.services[0]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FOOTER DEL PASO 1 */}
                            <div className="flex items-center justify-between pt-10 mt-10">
                                <span className="text-sm text-slate-400 italic">Paso 1 de 3: Selección de Arquitectura</span>
                                <Button
                                    size="lg"
                                    onClick={handleNextStep}
                                    disabled={!formData.architecture}
                                    className="bg-black text-white hover:bg-slate-800 px-8"
                                >
                                    Continuar &rarr;
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* --- PASO 2: CONFIGURACIÓN Y YAML --- */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 max-w-4xl mx-auto">

                            {/* Tarjeta 1: Detalles Básicos */}
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                <h3 className="text-xl font-bold text-slate-900">Detalles del Proyecto</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-700 font-semibold">Nombre del Proyecto</Label>
                                    <Input
                                        id="name"
                                        placeholder="ej. mi-app-ecommerce"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="h-11 bg-slate-50 focus-visible:ring-black"
                                    />
                                    <p className="text-[10px] text-slate-400">El nombre se usará para generar el Namespace en Kubernetes (ej. mi-app-ecommerce-2201980).</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="text-slate-700 font-semibold">Descripción</Label>
                                    <textarea
                                        id="desc"
                                        placeholder="Describe brevemente el propósito de este despliegue..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Tarjeta 2: Definición de Servicios (YAML) */}
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Definición de Servicios</h3>
                                        <p className="text-sm text-slate-500">Sube tu archivo o utiliza el editor web.</p>
                                    </div>

                                    {/* Botones Toggle (Upload vs Editor) */}
                                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                        <button
                                            onClick={() => setInputMode('upload')}
                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", inputMode === 'upload' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                                        >
                                            Subir Archivo
                                        </button>
                                        <button
                                            onClick={() => setInputMode('editor')}
                                            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", inputMode === 'editor' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                                        >
                                            Editor Web
                                        </button>
                                    </div>
                                </div>

                                {/* Zona de Subida (Drag & Drop simulado) */}
                                {inputMode === 'upload' && (
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                        {/* Input invisible que cubre toda la caja */}
                                        <input
                                            type="file"
                                            accept=".yml,.yaml"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-slate-200 mb-4 shadow-sm">
                                            <UploadCloud className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">Haz clic para subir el archivo aquí</p>
                                        <p className="text-xs text-slate-500 mt-1">Solo archivos .yml o .yaml</p>
                                    </div>
                                )}

                                {/* Editor Web (Monaco) */}
                                {inputMode === 'editor' && (
                                    <div className="rounded-xl overflow-hidden border border-slate-300 shadow-inner h-[400px]">
                                        <Editor
                                            height="100%"
                                            defaultLanguage="yaml"
                                            theme="vs-dark"
                                            value={formData.dockerComposeContent}
                                            onChange={(value) => setFormData({ ...formData, dockerComposeContent: value || '' })}
                                            options={{
                                                minimap: { enabled: true },
                                                fontSize: 13,
                                                wordWrap: "on",
                                                scrollBeyondLastLine: false,
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Recordatorio de Contrato (Figma) */}
                                <div className="mt-6 bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-3">
                                    <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-indigo-900 font-medium">Recuerda usar las etiquetas exactas para esta arquitectura:</p>
                                        <div className="flex gap-2 mt-2">
                                            {selectedArchDetails?.services.map(s => (
                                                <span key={s} className="text-xs font-mono font-bold bg-white text-indigo-700 px-2 py-0.5 rounded shadow-sm border border-indigo-100">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER DEL PASO 2 */}
                            <div className="flex items-center justify-between pt-6">
                                <Button variant="ghost" onClick={handlePrevStep} className="text-slate-500 hover:text-slate-900">
                                    &larr; Volver
                                </Button>

                                <Button
                                    size="lg"
                                    onClick={handleValidation} // <--- NUEVO EVENTO
                                    disabled={!formData.name || !formData.description || !formData.dockerComposeContent || isValidating}
                                    className="bg-black text-white hover:bg-slate-800 px-8"
                                >
                                    {isValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...</> : "Validar Configuración \u2192"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* --- PASO 3: DESPLIEGUE Y RESULTADOS --- */}
                    {step === 3 && validationResult && (
                        <div className="animate-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-20">

                            {/* ESCENARIO A: ERROR DE VALIDACIÓN */}
                            {!validationResult.success && (
                                <div className="space-y-6">
                                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-start gap-4">
                                        <div className="bg-red-100 p-2 rounded-full"><Server className="h-6 w-6 text-red-600" /></div>
                                        <div>
                                            <h3 className="text-red-900 font-bold text-lg">Validación Fallida</h3>
                                            <p className="text-red-700 text-sm mt-1">El archivo fue rechazado por el motor de composición de la plataforma.</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-900 mb-4">Detalle del Error</h4>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-sm text-slate-700">
                                            {/* Aquí se pinta el texto del error que mande Java/Python */}
                                            {formatError(validationResult.message)}
                                        </div>
                                    </div>

                                    <div className="flex justify-center mt-8">
                                        <Button variant="outline" size="lg" onClick={handlePrevStep} className="border-slate-300">
                                            &larr; Volver y Corregir Configuración
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ESCENARIO B: ÉXITO */}
                            {validationResult.success && (
                                <div className="space-y-6">
                                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl flex items-center gap-4">
                                        <div className="bg-emerald-100 p-2 rounded-full"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
                                        <div>
                                            <h3 className="text-emerald-900 font-bold text-lg">Validación Exitosa</h3>
                                            <p className="text-emerald-700 text-sm">Tu archivo cumple con todos los requisitos y cuotas disponibles.</p>
                                        </div>
                                    </div>

                                    {/* Recursos Calculados por Python */}
                                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-900 mb-6">Recursos a consumir</h4>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="border border-slate-100 rounded-lg p-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase">CPU</p>
                                                <p className="text-2xl font-bold text-slate-900 mt-1">{validationResult.data.requiredCpu}</p>
                                            </div>
                                            <div className="border border-slate-100 rounded-lg p-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Memoria</p>
                                                <p className="text-2xl font-bold text-slate-900 mt-1">{validationResult.data.requiredMemoryMb} <span className="text-sm font-normal text-slate-500">MB</span></p>
                                            </div>
                                            <div className="border border-slate-100 rounded-lg p-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Almacenamiento</p>
                                                <p className="text-2xl font-bold text-slate-900 mt-1">{validationResult.data.requiredStorageGb}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MANIFIESTOS (NUEVO) */}
                                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-900 mb-4">Manifiestos Kubernetes</h4>
                                        <p className="text-sm text-slate-500 mb-6">El sistema ha generado los siguientes objetos para tu arquitectura.</p>

                                        <div className="grid grid-cols-2 gap-4">
                                            {validationResult.data.generatedManifests?.map((manifestStr: string, idx: number) => {
                                                const lines = manifestStr.split('\n');
                                                const kind = lines.find((l: string) => l.startsWith('kind:'))?.split(':')[1]?.trim() || 'Unknown';
                                                const name = lines.find((l: string) => l.startsWith('  name:'))?.split(':')[1]?.trim() || 'resource';

                                                return (
                                                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-4">
                                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded w-12 text-center">{kind.substring(0, 2).toUpperCase()}</span>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">{name}.yaml</p>
                                                            <p className="text-xs text-slate-500">{kind}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Botón de Enviar a Producción CONECTADO A LA API */}
                                    <Button
                                        size="lg"
                                        className="w-full bg-black text-white hover:bg-slate-800 h-14 text-lg mt-8 shadow-xl shadow-black/10"
                                        onClick={async () => {
                                            try {
                                                await api.post(`/projects/${validationResult.data.projectId}/request-approval`);
                                                toast.success("¡Solicitud enviada al administrador!");
                                                queryClient.invalidateQueries({ queryKey: ["my-projects"] });
                                                navigate('/dashboard'); // Volvemos al dashboard
                                            } catch (error) {
                                                toast.error("Hubo un error al enviar la solicitud.");
                                            }
                                        }}
                                    >
                                        <Cloud className="mr-2 h-6 w-6" /> Solicitar Despliegue al Administrador
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};