import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Database, Layers, Box, Bell, Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore"; // Ruta corregida
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios"; // Importamos tu axios configurado
import { useProjectStore } from "@/hooks/useProjectStore";
import { cn } from "@/lib/utils";

const DashboardNavbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const getInitials = (name: string = "") => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-blue-600">
                        <Box className="h-5 w-5" />
                    </div>
                    <span>PaaS Core Education</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="text-slate-400 hover:text-slate-600 relative">
                    <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.role}</p>
                    </div>
                    <Avatar className="h-9 w-9 bg-indigo-100 border border-indigo-200 text-indigo-700 cursor-pointer">
                        <AvatarImage src="" />
                        <AvatarFallback className="font-bold">{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 ml-2" title="Cerrar sesión">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export const StudentDashboard = () => {
    const setSelectedProject = useProjectStore((state) => state.setSelectedProject);
    const selectedProjectId = useProjectStore((state) => state.selectedProjectId);

    // --- LLAMADA A LA API REAL (JAVA MS-01) ---
    const { data: projects, isLoading } = useQuery({
        queryKey: ["my-projects"],
        queryFn: async () => {
            const response = await api.get('/projects');
            return response.data; // Retorna el array de proyectos
        },
    });

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
            <DashboardNavbar />

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col z-10">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-slate-900 text-lg">Mis Proyectos</h2>
                            <Badge variant="secondary" className="text-xs font-normal bg-slate-100 text-slate-500">
                                {projects?.length || 0} total
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Buscar..." className="pl-9 bg-slate-50 border-slate-200" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-xs">Cargando proyectos...</span>
                            </div>
                        ) : projects?.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                No tienes proyectos activos.
                            </div>
                        ) : (
                            projects?.map((project: any) => (
                                <div
                                    key={project.id}
                                    onClick={() => setSelectedProject(project.id)}
                                    className={cn(
                                        "bg-white p-3 rounded-lg border transition-all cursor-pointer relative group",
                                        selectedProjectId === project.id ? "border-blue-400 shadow-sm ring-1 ring-blue-500/20" : "border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                                                {project.architecture === "THREE_TIER" && <Layers className="w-4 h-4" />}
                                                {project.architecture === "MONOLITH" && <Box className="w-4 h-4" />}
                                                {project.architecture === "DB_STANDALONE" && <Database className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 leading-none">{project.name}</h3>
                                                <p className="text-[11px] text-slate-500 mt-1 capitalize">
                                                    {project.architecture.replace("_", " ").toLowerCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={cn("h-2 w-2 rounded-full",
                                            project.status === "DEPLOYED" ? "bg-emerald-500" :
                                                project.status === "PENDING_APPROVAL" ? "bg-amber-400" : "bg-red-500"
                                        )}></span>
                                    </div>

                                    <div className="border-t border-slate-50 my-2"></div>

                                    <div className="flex justify-between items-center">
                                        <code className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                                            {project.namespaceName || "Generando..."}
                                        </code>
                                        <Badge className={cn("text-[10px] font-bold px-1.5 py-0 h-5 border",
                                            project.status === "DEPLOYED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                project.status === "PENDING_APPROVAL" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                    "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <main className="flex-1 bg-slate-50 flex items-center justify-center p-12 relative">
                    {!selectedProjectId ? (
                        <div className="w-full max-w-2xl bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center py-20 px-8 text-center z-10">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-200 group-hover:scale-110 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all duration-300">
                                <Plus className="w-10 h-10 text-slate-400 group-hover:text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600">Crear Nuevo Proyecto</h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                Sube tu archivo <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-sm border border-slate-200">docker-compose.yml</code>
                            </p>
                        </div>
                    ) : (
                        <div className="text-slate-400 flex flex-col items-center gap-4">
                            <p>Has seleccionado el proyecto: {selectedProjectId}</p>
                            <Button variant="outline" onClick={() => setSelectedProject(null)}>Cerrar detalles</Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};