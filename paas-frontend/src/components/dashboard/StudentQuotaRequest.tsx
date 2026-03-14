import { useState } from "react";
import { api } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Cpu, MemoryStick, HardDrive, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export const StudentQuotaRequest = ({ onBack }: { onBack: () => void }) => {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Inicializamos el formulario con cuotas ligeramente superiores a las que ya tiene
    const [formData, setFormData] = useState({
        cpu: 4.0,
        memoryMb: 4096,
        storageMb: 10240,
        justification: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post('/quotas/request', formData);
            toast.success("¡Solicitud enviada exitosamente al administrador!");
            onBack(); // Lo devolvemos a la vista principal
        } catch (error: any) {
            toast.error(error.response?.data || "Error al enviar la solicitud. Puede que ya tengas una pendiente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col h-full absolute inset-0 overflow-y-auto bg-slate-50">

            {/* NAVBAR BREADCRUMB */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center shadow-sm">
                <Button variant="ghost" onClick={onBack} className="mr-4 text-slate-500 hover:text-slate-900 px-2 h-8">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                </Button>
                <div className="flex items-center text-sm text-slate-500">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="font-semibold text-slate-900">Solicitud de Aumento de Cuotas</span>
                </div>
            </div>

            <div className="p-12 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">Aumentar Recursos Globales</h1>
                    <p className="text-slate-500 mt-2">
                        Solicita un aumento en los límites máximos de tu cuenta. Actualmente tu rol ({user?.role})
                        tiene asignados límites estándar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* TARJETA DE RECURSOS */}
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Nuevos límites deseados</h3>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-slate-600"><Cpu className="h-4 w-4" /> CPU (Cores)</Label>
                                <Input
                                    type="number" step="0.1" min="1" required
                                    value={formData.cpu}
                                    onChange={(e) => setFormData({ ...formData, cpu: parseFloat(e.target.value) })}
                                    className="h-12 text-lg font-semibold bg-slate-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-slate-600"><MemoryStick className="h-4 w-4" /> Memoria (MB)</Label>
                                <Input
                                    type="number" step="256" min="512" required
                                    value={formData.memoryMb}
                                    onChange={(e) => setFormData({ ...formData, memoryMb: parseInt(e.target.value) })}
                                    className="h-12 text-lg font-semibold bg-slate-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-slate-600"><HardDrive className="h-4 w-4" /> Almacenamiento (MB)</Label>
                                <Input
                                    type="number" step="1024" min="1024" required
                                    value={formData.storageMb}
                                    onChange={(e) => setFormData({ ...formData, storageMb: parseInt(e.target.value) })}
                                    className="h-12 text-lg font-semibold bg-slate-50"
                                />
                                <p className="text-[10px] text-slate-400 text-right">1024 MB = 1 GB</p>
                            </div>
                        </div>
                    </div>

                    {/* TARJETA DE JUSTIFICACIÓN */}
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Motivo de la solicitud</h3>
                        <p className="text-xs text-slate-500 mb-4">Explícale al profesor por qué necesitas estos recursos adicionales para tu proyecto o tesis.</p>

                        <textarea
                            required
                            placeholder="Ej: Profesor, estoy intentando desplegar una base de datos con un dataset de prueba grande para la materia de Bases de Datos I..."
                            value={formData.justification}
                            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                            className="w-full min-h-[120px] p-4 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isLoading || !formData.justification}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base shadow-lg shadow-blue-200"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <TrendingUp className="h-5 w-5 mr-2" />}
                            Enviar Solicitud a Revisión
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};