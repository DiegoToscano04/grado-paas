import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { Loader2, FileCode2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { ManifestExplorer } from "./ManifestExplorer";

export const AdminProjectReview = ({ projectId, studentInfo, onFinished }: any) => {
    const queryClient = useQueryClient();
    const [isExploring, setIsExploring] = useState(false);

    // Estados para el modal de rechazo
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setIsExploring(false);
        setShowRejectModal(false); // Por si acaso cambia de proyecto mientras rechaza
    }, [projectId]);

    // Obtener detalles completos del proyecto
    const { data: project, isLoading } = useQuery({
        queryKey: ["admin-project", projectId],
        queryFn: async () => {
            const res = await api.get(`/admin/projects/${projectId}`);
            return res.data;
        }
    });

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await api.post(`/admin/projects/${projectId}/approve`);
            toast.success("Despliegue aprobado. K8s iniciando...");
            queryClient.invalidateQueries({ queryKey: ["admin-pending-projects"] });
            queryClient.invalidateQueries({ queryKey: ["admin-history"] });
            onFinished(); // Vuelve al directorio
        } catch (error) {
            toast.error("Error al aprobar.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Debes proveer un motivo");
            return;
        }
        setIsProcessing(true);
        try {
            await api.post(`/admin/projects/${projectId}/reject`, { reason: rejectReason });
            toast.success("Proyecto rechazado.");
            queryClient.invalidateQueries({ queryKey: ["admin-pending-projects"] });
            queryClient.invalidateQueries({ queryKey: ["admin-history"] });
            onFinished();
        } catch (error) {
            toast.error("Error al rechazar.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
    if (!project) return <div>Error cargando datos.</div>;

    // Si hizo clic en Revisar Código
    if (isExploring) {
        return <ManifestExplorer project={project} onBack={() => setIsExploring(false)} isAdmin={true} />;
    }

    return (
        <div className="flex flex-col h-full relative bg-white">

            {/* MODAL DE RECHAZO (Overlay) */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <XCircle className="text-red-500" /> Motivo del Rechazo
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Este mensaje será enviado al estudiante.</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none mb-6 bg-slate-50"
                            placeholder="Ej: Faltan variables de entorno críticas..."
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancelar</Button>
                            <Button onClick={handleReject} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white">
                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar Rechazo"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENEDOR DEL SCROLL (Ocupa todo el ancho, pega el scroll a la derecha) */}
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar">

                {/* CONTENEDOR DEL CONTENIDO (Ancho máximo expandido a 6xl y centrado) */}
                <div className="p-12 max-w-6xl mx-auto">

                    {/* HEADER Y TARJETA DE ESTUDIANTE */}
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-extrabold text-slate-900">{project.name}</h1>
                                <Badge className="bg-slate-100 text-slate-600 border-transparent shadow-sm capitalize">{project.architecture.replace("_", " ").toLowerCase()}</Badge>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6 max-w-3xl">
                                <p className="text-sm text-slate-600 italic">"{project.description}"</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4 min-w-[200px] shrink-0">
                            <Avatar className="h-10 w-10 bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
                                <AvatarFallback>{studentInfo.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{studentInfo.name}</p>
                                <p className="text-[10px] font-mono text-slate-500">Cod: {studentInfo.code}</p>
                            </div>
                        </div>
                    </div>

                    {/* RECURSOS SOLICITADOS */}
                    <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Recursos Solicitados</h3>
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
                            <span className="text-sm font-medium text-slate-500">CPU</span>
                            <span className="font-bold text-emerald-600">{project.reqCpu} vCPU <span className="text-xs font-normal opacity-70">(OK)</span></span>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
                            <span className="text-sm font-medium text-slate-500">Memoria</span>
                            <span className="font-bold text-emerald-600">{project.reqMemoryMb} MB <span className="text-xs font-normal opacity-70">(OK)</span></span>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
                            <span className="text-sm font-medium text-slate-500">Almacenamiento</span>
                            <span className="font-bold text-emerald-600">{(project.reqStorageMb / 1024).toFixed(1)} GB <span className="text-xs font-normal opacity-70">(OK)</span></span>
                        </div>
                    </div>

                    {/* MANIFIESTOS A DESPLEGAR */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">Manifiestos a Desplegar</h3>
                        <button onClick={() => setIsExploring(true)} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                            <FileCode2 className="h-4 w-4" /> Revisar código
                        </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden mb-10">
                        {project.generatedManifests?.map((manifestStr: string, idx: number) => {
                            const lines = manifestStr.split('\n');
                            const kind = lines.find(l => l.startsWith('kind:'))?.split(':')[1]?.trim() || 'Unknown';
                            const name = lines.find(l => l.startsWith('  name:'))?.split(':')[1]?.trim() || 'resource';

                            return (
                                <div key={idx} className="flex justify-between items-center p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileCode2 className="h-5 w-5 text-slate-400" />
                                        <span className="font-mono text-sm font-bold text-slate-700">{name}.yaml</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-500">{kind}</Badge>
                                </div>
                            );
                        })}
                    </div> {/* <-- Cierra el div de los manifiestos */}
                </div> {/* <-- Cierra el div del contenido (max-w-6xl) */}
            </div> {/* <-- Cierra el div del Scroll (w-full custom-scrollbar) */}

            {/* FOOTER FIJO (Botones de Acción) */}
            <div className="flex-none bg-white border-t border-slate-200 p-6 px-12 flex justify-between items-center shrink-0">
                <p className="text-xs text-slate-500">Esta acción notificará al estudiante y aplicará cambios en el clúster.</p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setShowRejectModal(true)} disabled={isProcessing} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 px-8 font-bold">
                        <XCircle className="mr-2 h-4 w-4" /> Rechazar
                    </Button>
                    <Button onClick={handleApprove} disabled={isProcessing} className="bg-black hover:bg-slate-800 text-white h-11 px-8 font-bold shadow-lg shadow-black/10">
                        {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Aprobar Despliegue
                    </Button>
                </div>
            </div>

        </div>
    );
};