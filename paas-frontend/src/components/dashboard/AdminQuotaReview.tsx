import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, X, CheckCircle2, Loader2, Cpu, MemoryStick, HardDrive, XCircle } from "lucide-react"; // <-- Importamos XCircle
import { api } from "@/api/axios";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

export const AdminQuotaReview = ({ request, onFinished }: { request: any, onFinished: () => void }) => {
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);

    // --- NUEVOS ESTADOS PARA EL RECHAZO ---
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // Función para APROBAR (Mantiene un mensaje estándar de éxito)
    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await api.post(`/admin/quotas/${request.requestId}/review`, {
                approve: true,
                adminResponse: "Solicitud aprobada. Administra tus nuevos recursos con responsabilidad."
            });
            toast.success("Cuotas actualizadas exitosamente.");

            queryClient.invalidateQueries({ queryKey: ["admin-pending-quotas"] });
            queryClient.invalidateQueries({ queryKey: ["admin-students"] });
            onFinished();
        } catch (error) {
            toast.error("Ocurrió un error al aprobar la solicitud.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Función para RECHAZAR (Envía el texto que el admin escribió)
    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Debes proveer un motivo de rechazo.");
            return;
        }

        setIsProcessing(true);
        try {
            await api.post(`/admin/quotas/${request.requestId}/review`, {
                approve: false,
                adminResponse: rejectReason
            });
            toast.success("Solicitud rechazada y estudiante notificado.");

            queryClient.invalidateQueries({ queryKey: ["admin-pending-quotas"] });
            onFinished();
        } catch (error) {
            toast.error("Ocurrió un error al rechazar la solicitud.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-12 flex flex-col items-center relative">

            {/* --- MODAL DE RECHAZO (Exactamente igual al de proyectos) --- */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <XCircle className="text-red-500" /> Motivo del Rechazo
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Explica al estudiante por qué no puedes otorgarle estas cuotas.</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none mb-6 bg-slate-50"
                            placeholder="Ej: Solo otorgamos 5GB de disco para proyectos de tesis con carta de aprobación..."
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

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="w-full max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4">

                {/* TARJETA MOTIVO */}
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex gap-6">
                    <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Solicitud de Aumento de Recursos</h2>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 mb-3">Motivo de la solicitud</p>
                        <p className="text-sm text-slate-600 italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                            "{request.justification}"
                        </p>
                    </div>
                </div>

                {/* TARJETA AJUSTES */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
                    <Button variant="ghost" onClick={onFinished} className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100">
                        <X className="h-5 w-5" />
                    </Button>

                    <div className="p-8 pb-6 border-b border-slate-100">
                        <h2 className="text-2xl font-extrabold text-slate-900">Ajustar Límites Globales</h2>
                        <p className="text-slate-500 mt-1">Modificando cuotas para <span className="font-bold text-slate-700">{request.studentName}</span></p>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                            <span className="font-bold shrink-0 mt-0.5">ℹ️</span>
                            <p>Estos límites aplican a la suma de <strong>todos</strong> los proyectos del usuario. Los cambios se reflejarán inmediatamente en nuevas validaciones.</p>
                        </div>

                        {/* INPUTS (Read-only) */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <label className="font-bold text-slate-700 flex items-center gap-2"><Cpu className="h-4 w-4" /> Límite de CPU (Cores)</label>
                                    <span className="text-slate-400">Solicitado</span>
                                </div>
                                <div className="relative">
                                    <input type="text" readOnly value={request.requestedCpu} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none" />
                                    <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-bold">vCPU</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <label className="font-bold text-slate-700 flex items-center gap-2"><MemoryStick className="h-4 w-4" /> Límite de Memoria (RAM)</label>
                                    <span className="text-slate-400">Solicitado</span>
                                </div>
                                <div className="relative">
                                    <input type="text" readOnly value={request.requestedMemoryMb} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none" />
                                    <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-bold">MB</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <label className="font-bold text-slate-700 flex items-center gap-2"><HardDrive className="h-4 w-4" /> Almacenamiento (Disco)</label>
                                    <span className="text-slate-400">Solicitado</span>
                                </div>
                                <div className="relative">
                                    <input type="text" readOnly value={(request.requestedStorageMb / 1024).toFixed(1)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none" />
                                    <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-bold">GB</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 flex justify-end gap-4 border-t border-slate-200">
                        {/* AHORA ABRE EL MODAL EN LUGAR DE ENVIAR DIRECTO */}
                        <Button variant="outline" onClick={() => setShowRejectModal(true)} disabled={isProcessing} className="border-slate-300 text-slate-600 font-semibold px-6 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                            Rechazar
                        </Button>
                        <Button onClick={handleApprove} disabled={isProcessing} className="bg-black hover:bg-slate-800 text-white font-bold px-8 shadow-lg shadow-black/10">
                            {isProcessing ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                            Confirmar Nuevos Límites
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};