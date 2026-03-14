import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { Loader2, FileCode2, XCircle, CheckCircle2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const AdminHistoryReview = ({ historyData, studentInfo, onFinished }: any) => {
    // Obtenemos los detalles técnicos del proyecto (CPU, RAM, Manifiestos)
    const { data: project, isLoading } = useQuery({
        queryKey: ["admin-project-history", historyData.id],
        queryFn: async () => {
            const res = await api.get(`/admin/projects/${historyData.id}`);
            return res.data;
        }
    });

    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
    if (!project) return <div>Error cargando datos.</div>;

    const isRejected = historyData.status === 'REJECTED';

    return (
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-slate-50 relative">
            <Button variant="ghost" onClick={onFinished} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-200 z-10">
                <X className="h-6 w-6" />
            </Button>

            <div className="p-12 max-w-5xl mx-auto animate-in fade-in duration-300">

                {/* --- CARTEL DE AUDITORÍA (Figma) --- */}
                <div className={`p-6 rounded-xl border mb-10 ${isRejected ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex gap-4">
                        {isRejected ? <XCircle className="h-6 w-6 text-red-500 shrink-0" /> : <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />}

                        {/* AÑADIMOS min-w-0 AQUÍ PARA EVITAR QUE SE DESBORDE */}
                        <div className="w-full min-w-0">
                            <h3 className={`font-bold ${isRejected ? 'text-red-900' : 'text-emerald-900'}`}>
                                Solicitud {isRejected ? 'Rechazada' : 'Aprobada'}
                            </h3>
                            <p className={`text-xs mt-1 mb-4 ${isRejected ? 'text-red-700' : 'text-emerald-700'}`}>
                                Por: <span className="font-bold">{historyData.adminName}</span> • Fecha: {new Date(historyData.processedAt).toLocaleString()}
                            </p>

                            {/* AÑADIMOS break-words AQUÍ PARA CORTAR LA PALABRA GIGANTE */}
                            <div className="bg-white p-4 rounded-lg border shadow-sm text-sm italic text-slate-600 break-words">
                                "{historyData.reason}"
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- HEADER Y TARJETA ESTUDIANTE --- */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-extrabold text-slate-900">{project.name}</h1>
                            <Badge className="bg-slate-200 text-slate-600 border-transparent shadow-sm capitalize">{project.architecture.replace("_", " ").toLowerCase()}</Badge>
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

                {/* --- RECURSOS Y MANIFIESTOS (Lectura) --- */}
                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Recursos Solicitados</h3>
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="border border-slate-200 bg-white rounded-xl p-5 flex justify-between items-center shadow-sm">
                        <span className="text-sm font-medium text-slate-500">CPU</span>
                        <span className="font-bold text-slate-900">{project.reqCpu} vCPU</span>
                    </div>
                    <div className="border border-slate-200 bg-white rounded-xl p-5 flex justify-between items-center shadow-sm">
                        <span className="text-sm font-medium text-slate-500">Memoria</span>
                        <span className="font-bold text-slate-900">{project.reqMemoryMb} MB</span>
                    </div>
                    <div className="border border-slate-200 bg-white rounded-xl p-5 flex justify-between items-center shadow-sm">
                        <span className="text-sm font-medium text-slate-500">Almacenamiento</span>
                        <span className="font-bold text-slate-900">{(project.reqStorageMb / 1024).toFixed(1)} GB</span>
                    </div>
                </div>

                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Manifiestos Desplegados</h3>
                <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden mb-10 opacity-80 pointer-events-none">
                    {/* Los ponemos transparentes e inclickeables para indicar que es un historial inmutable */}
                    {project.generatedManifests?.map((manifestStr: string, idx: number) => {
                        const lines = manifestStr.split('\n');
                        const kind = lines.find(l => l.startsWith('kind:'))?.split(':')[1]?.trim() || 'Unknown';
                        const name = lines.find(l => l.startsWith('  name:'))?.split(':')[1]?.trim() || 'resource';

                        return (
                            <div key={idx} className="flex justify-between items-center p-4 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <FileCode2 className="h-5 w-5 text-slate-400" />
                                    <span className="font-mono text-sm font-bold text-slate-700">{name}.yaml</span>
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500">{kind}</Badge>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};