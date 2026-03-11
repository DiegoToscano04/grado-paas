import { ManifestExplorer } from "./ManifestExplorer";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiK8s } from "@/api/axios";
import { Loader2, RefreshCw, Trash2, Terminal, FileCode2, Globe, Cpu, MemoryStick, HardDrive, Folder, Clock, AlertCircle, Cloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Utilidad para calcular el "Uptime" o tiempo transcurrido
const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

export const ProjectDetails = ({ projectId, onBack }: { projectId: string, onBack: () => void }) => {
    const [isExploringManifests, setIsExploringManifests] = useState(false);
    useEffect(() => {
        setIsExploringManifests(false);
    }, [projectId]);
    const queryClient = useQueryClient();
    const { data: project, isLoading, refetch } = useQuery({
        queryKey: ["project", projectId],
        queryFn: async () => {
            const res = await api.get(`/projects/${projectId}`);
            return res.data;
        }
    });

    const [isRequesting, setIsRequesting] = useState(false);

    // --- NUEVO: ESTADOS PARA LA TERMINAL ---
    const [selectedPod, setSelectedPod] = useState<string | null>(null);

    // 1. Obtener la lista de contenedores (Pods) del proyecto
    const { data: pods = [] } = useQuery({
        queryKey: ["k8s-status", project?.namespaceName],
        queryFn: async () => {
            const res = await apiK8s.get(`/${project?.namespaceName}/status`);
            return res.data.pods;
        },
        enabled: !!project?.namespaceName && project?.status === 'DEPLOYED',
        refetchInterval: 10000, // Actualiza el estado de los pods cada 10 seg
    });

    // Auto-seleccionar el primer pod cuando la lista cargue
    useEffect(() => {
        if (pods.length > 0 && !selectedPod) {
            setSelectedPod(pods[0].name);
        }
    }, [pods, selectedPod]);

    // 2. Obtener los logs en tiempo real del pod seleccionado
    const { data: logs, isLoading: isLoadingLogs } = useQuery({
        queryKey: ["k8s-logs", project?.namespaceName, selectedPod],
        queryFn: async () => {
            const res = await apiK8s.get(`/${project?.namespaceName}/logs/${selectedPod}`);
            return res.data.logs;
        },
        enabled: !!selectedPod && !!project?.namespaceName && project?.status === 'DEPLOYED',
        refetchInterval: 3000, // ¡Efecto "Live"! Pide logs cada 3 segundos
    });

    // Función auxiliar para cortar el nombre largo del pod (ej. "front-855484b6c7" -> "front")
    const getShortName = (podName: string) => podName.split('-')[0];

    const handleRequestApproval = async () => {
        setIsRequesting(true);
        try {
            await api.post(`/projects/${projectId}/request-approval`);
            toast.success("Solicitud enviada al administrador.");
            // Le decimos al Sidebar que recargue sus datos
            queryClient.invalidateQueries({ queryKey: ["my-projects"] });
            refetch(); // Recarga los datos mágicamente y cambiará a PENDING_APPROVAL
        } catch (error) {
            toast.error("Error al enviar la solicitud.");
        } finally {
            setIsRequesting(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto?")) {
            try {
                await api.delete(`/projects/${projectId}`);
                toast.success("Proceso de eliminación iniciado");
                queryClient.invalidateQueries({ queryKey: ["my-projects"] });
                onBack();
            } catch (error) {
                toast.error("Error al eliminar el proyecto");
            }
        }
    };

    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (!project) return <div>Error cargando el proyecto.</div>;
    if (isExploringManifests) {
        return <ManifestExplorer project={project} onBack={() => setIsExploringManifests(false)} />;
    }

    const isWeb = project.architecture !== 'DB_STANDALONE';
    const accessUrl = isWeb ? `http://front-${project.namespaceName}.apps.uislab.cloud` : 'Acceso interno (NodePort)';

    return (
        // El contenedor principal ahora ocupa el 100% de la altura y permite scroll interno
        <div className="w-full flex flex-col h-full absolute inset-0 overflow-y-auto bg-slate-50">

            {/* --- NAVBAR BREADCRUMB FIJO UNIFICADO --- */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center text-sm text-slate-500">
                    <span className="hover:text-slate-900 cursor-pointer transition-colors flex items-center gap-2" onClick={onBack}>
                        <Folder className="h-4 w-4" /> Mis Proyectos
                    </span>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-slate-900">{project.name}</span>
                </div>
            </div>

            {/* --- CONTENIDO SCROLLEABLE --- */}
            <div className="px-12 py-8 max-w-5xl animate-in fade-in duration-300">

                {/* HEADER GENERAL */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
                            <Badge className={cn("text-[10px] uppercase px-2 py-0.5",
                                project.status === "DEPLOYED" ? "bg-emerald-100 text-emerald-700" :
                                    project.status === "PENDING_APPROVAL" ? "bg-amber-100 text-amber-700" :
                                        "bg-red-100 text-red-700"
                            )}>
                                {project.status === "DEPLOYED" ? "Deployed" : project.status}
                            </Badge>
                        </div>

                        {project.status === "DEPLOYED" && (
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                {isWeb && (
                                    <a href={accessUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                        <Globe className="h-4 w-4" /> {accessUrl}
                                    </a>
                                )}
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    Uptime: {timeSince(project.updatedAt)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="h-9 border-slate-200" disabled={project.status !== 'DEPLOYED'}>
                            <RefreshCw className="mr-2 h-4 w-4 text-slate-500" /> Redeploy
                        </Button>
                        <Button onClick={handleDelete} className="h-9 bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>

                {/* --- RENDERIZADO CONDICIONAL POR ESTADO --- */}

                {/* ESTADO: BORRADOR (WAITING_USER_CONFIRMATION) */}
                {project.status === 'WAITING_USER_CONFIRMATION' && (
                    <div className="bg-blue-50 border border-blue-200 p-12 rounded-2xl flex flex-col items-center justify-center text-center mt-10 shadow-sm">
                        <Cloud className="h-16 w-16 text-blue-400 mb-4" />
                        <h2 className="text-2xl font-bold text-blue-900">Borrador Validado</h2>
                        <p className="text-blue-700 mt-2 max-w-md mb-8">
                            Tu archivo docker-compose es válido y los manifiestos están listos. Sin embargo, no has solicitado su despliegue.
                        </p>
                        <Button
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base shadow-lg shadow-blue-200"
                            onClick={handleRequestApproval}
                            disabled={isRequesting}
                        >
                            {isRequesting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Cloud className="mr-2 h-5 w-5" />}
                            Solicitar Despliegue al Administrador
                        </Button>
                    </div>
                )}

                {project.status === 'PENDING_APPROVAL' && (
                    <div className="bg-amber-50 border border-amber-200 p-12 rounded-2xl flex flex-col items-center justify-center text-center mt-10">
                        <AlertCircle className="h-16 w-16 text-amber-400 mb-4" />
                        <h2 className="text-2xl font-bold text-amber-900">Esperando Aprobación</h2>
                        <p className="text-amber-700 mt-2 max-w-md">
                            Su proyecto ha sido validado correctamente. Será desplegado automáticamente en el clúster cuando el administrador lo acepte.
                        </p>
                    </div>
                )}

                {project.status === 'DEPLOYED' && (
                    <>
                        {/* MÉTRICAS */}
                        <div className="mb-4 flex items-center gap-2 text-slate-900 font-bold mt-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            Métricas Asignadas
                        </div>
                        <div className="grid grid-cols-3 gap-6 mb-10">
                            {/* CPU Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-slate-500">CPU usage</span>
                                    <Cpu className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {project.reqCpu} <span className="text-sm font-normal text-slate-500">vCPU</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min((project.reqCpu / 2.0) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Memory Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-slate-500">Memory</span>
                                    <MemoryStick className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {project.reqMemoryMb} <span className="text-sm font-normal text-slate-500">MB</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min((project.reqMemoryMb / 2048) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Storage Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-slate-500">Storage (PVC)</span>
                                    <HardDrive className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {(project.reqStorageMb / 1024).toFixed(1)} <span className="text-sm font-normal text-slate-500">GB</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${project.reqStorageMb === 0 ? 0 : Math.min((project.reqStorageMb / 5120) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* --- LOGS EN TIEMPO REAL --- */}
                        <div className="flex items-center justify-between mb-4 mt-8">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <Terminal className="h-5 w-5" /> _System Logs
                            </div>
                            {/* Insignia parpadeante de "Live" */}
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Live Streaming
                            </div>
                        </div>

                        <div className="bg-[#0F172A] rounded-xl p-5 min-h-[350px] flex flex-col font-mono text-xs text-slate-300 mb-10 shadow-2xl border border-slate-800">

                            {/* PESTAÑAS (TABS) DE LOS CONTENEDORES */}
                            <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-800 pb-3">
                                {pods.length === 0 ? (
                                    <span className="text-slate-500 italic">Buscando contenedores en el clúster...</span>
                                ) : (
                                    pods.map((pod: any) => (
                                        <button
                                            key={pod.name}
                                            onClick={() => setSelectedPod(pod.name)}
                                            className={cn(
                                                "px-3 py-1.5 rounded transition-all flex items-center gap-2",
                                                selectedPod === pod.name
                                                    ? "bg-slate-700 text-white font-semibold shadow-inner"
                                                    : "hover:bg-slate-800 text-slate-400"
                                            )}
                                        >
                                            {/* Punto de color que indica si el contenedor está sano */}
                                            <span className={cn(
                                                "h-2 w-2 rounded-full",
                                                pod.phase === "Running" ? "bg-emerald-500" :
                                                    pod.phase === "Pending" ? "bg-amber-500" : "bg-red-500"
                                            )}></span>
                                            {getShortName(pod.name)}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* CONSOLA NEGRA SCROLLEABLE */}
                            <div className="flex-1 overflow-y-auto whitespace-pre-wrap leading-relaxed max-h-[400px] text-green-400/90 custom-scrollbar pr-2">
                                {isLoadingLogs ? (
                                    <div className="flex items-center gap-2 text-slate-500 italic">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Obteniendo stream de Kubernetes...
                                    </div>
                                ) : logs ? (
                                    logs
                                ) : (
                                    <span className="text-slate-500">No hay logs disponibles para este contenedor (Aún se está creando o falló).</span>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* --- SECCIÓN MANIFIESTOS (AHORA VISIBLE SIEMPRE QUE EXISTAN) --- */}
                {project.generatedManifests && project.generatedManifests.length > 0 && (
                    <div className="mt-12 border-t border-slate-200 pt-8 mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <FileCode2 className="h-5 w-5" /> Manifiestos Generados
                            </div>
                            <span
                                onClick={() => setIsExploringManifests(true)}
                                className="text-sm text-blue-600 hover:underline cursor-pointer font-bold"
                            >
                                Ver todos &rarr;
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {project.generatedManifests?.slice(0, 4).map((manifestStr: string, idx: number) => {
                                const lines = manifestStr.split('\n');
                                const kind = lines.find(l => l.startsWith('kind:'))?.split(':')[1]?.trim() || 'Unknown';
                                const name = lines.find(l => l.startsWith('  name:'))?.split(':')[1]?.trim() || 'resource';

                                return (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:border-blue-300 transition-colors">
                                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded w-max border border-indigo-100">{kind}</span>
                                        <span className="font-bold text-slate-900 text-sm truncate">{name}.yaml</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};