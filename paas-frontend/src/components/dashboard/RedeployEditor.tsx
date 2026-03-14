import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { api } from '@/api/axios';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export const RedeployEditor = ({ project, onCancel, onSuccess }: any) => {
    // Cargamos el código que Java nos manda de la base de datos
    const [code, setCode] = useState(project.dockerComposeContent || '');
    const [isValidating, setIsValidating] = useState(false);
    const queryClient = useQueryClient();

    const handleUpdate = async () => {
        setIsValidating(true);
        try {
            await api.put(`/projects/${project.id}`, {
                dockerComposeContent: code
            });

            toast.success("¡Nueva versión validada y generada correctamente!");

            // Recargamos los datos para que el Dashboard vea el nuevo estado (Borrador)
            queryClient.invalidateQueries({ queryKey: ["my-projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });

            onSuccess(); // Cierra el editor
        } catch (error: any) {
            const errorMessage = error.response?.data || "Error desconocido en la validación";
            toast.error(
                <div className="flex flex-col">
                    <strong>Validación Fallida</strong>
                    <span className="text-xs mt-1">{errorMessage}</span>
                </div>,
                { duration: 6000 } // Lo dejamos más tiempo en pantalla para que lo lea
            );
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="absolute inset-0 z-40 bg-slate-50 flex flex-col animate-in fade-in zoom-in-95">
            {/* Header del Editor */}
            <div className="flex-none bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Actualizar Configuración</h2>
                    <p className="text-xs text-slate-500">Editando proyecto: <span className="font-mono font-bold text-blue-600">{project.name}</span></p>
                </div>
                <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Zona del Monaco Editor */}
            <div className="flex-1 min-h-0 p-8 flex flex-col max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-end mb-4">
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">docker-compose.yaml</p>
                </div>

                <div className="flex-1 rounded-xl overflow-hidden border border-slate-300 shadow-2xl">
                    <Editor
                        height="100%"
                        defaultLanguage="yaml"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>

                {/* Footer de Acción */}
                <div className="flex justify-end mt-6">
                    <Button
                        size="lg"
                        onClick={handleUpdate}
                        disabled={!code || isValidating}
                        className="bg-black text-white hover:bg-slate-800 px-8 shadow-lg shadow-black/10"
                    >
                        {isValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando Motor Python...</> : "Validar y Actualizar \u2192"}
                    </Button>
                </div>
            </div>
        </div>
    );
};