import { AdminHistoryReview } from "@/components/dashboard/AdminHistoryReview";
import { AdminQuotaReview } from "@/components/dashboard/AdminQuotaReview";
import { AdminProjectReview } from "@/components/dashboard/AdminProjectReview";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Bell, MoreHorizontal, Cloud, Loader2, FolderClock, LogOut, TrendingUp } from "lucide-react"; // <--- Importado LogOut
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { useAuthStore } from "@/store/authStore";
import { NotificationMenu } from "@/components/shared/NotificationMenu";

export const AdminDashboard = () => {
    const { user, logout } = useAuthStore();

    const [searchStudent, setSearchStudent] = useState("");
    const [searchProject, setSearchProject] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // NUEVO ESTADO: Controla qué vemos en la pantalla principal
    const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'deployments' | 'history' | 'quotas'>('deployments');
    const [selectedQuotaRequest, setSelectedQuotaRequest] = useState<any>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

    // NUEVO QUERY: Traer el historial
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ["admin-history"],
        queryFn: async () => {
            const res = await api.get('/admin/projects/history');
            return res.data;
        }
    });

    // NUEVO QUERY: Traer las cuotas pendientes
    const { data: pendingQuotas } = useQuery({
        queryKey: ["admin-pending-quotas"],
        queryFn: async () => {
            const res = await api.get('/admin/quotas/pending');
            return res.data;
        },
        refetchInterval: 15000
    });

    const studentsPerPage = 7;

    const { data: students, isLoading: loadingStudents } = useQuery({
        queryKey: ["admin-students"],
        queryFn: async () => {
            const res = await api.get('/admin/users');
            return res.data;
        },
        refetchInterval: 30000
    });

    const { data: pendingProjects, isLoading: loadingPending } = useQuery({
        queryKey: ["admin-pending-projects"],
        queryFn: async () => {
            const res = await api.get('/admin/projects/pending');
            return res.data;
        },
        refetchInterval: 10000
    });

    const getInitials = (name: string = "Us") => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        const m = Math.floor(seconds / 60);
        if (m < 1) return `Hace unos segundos`;
        if (m < 60) return `Hace ${m} minutos`;
        const h = Math.floor(m / 60);
        return `Hace ${h} horas`;
    };

    const getStudentInfoByNamespace = (namespace: string) => {
        if (!students || !namespace) return { name: "Desconocido", code: "N/A", initials: "NA" };
        const parts = namespace.split('-');
        const code = parts[parts.length - 1];
        const student = students.find((s: any) => s.code === code);

        if (student) return { name: student.name, code: student.code, initials: getInitials(student.name) };
        return { name: "Estudiante", code: code, initials: "ST" };
    };

    // CORRECCIÓN 2: Buscador inteligente (Proyecto + Nombre + Código)
    const filteredProjects = pendingProjects?.filter((p: any) => {
        const searchTerm = searchProject.toLowerCase();
        const student = getStudentInfoByNamespace(p.namespaceName);
        return p.name.toLowerCase().includes(searchTerm) ||
            student.name.toLowerCase().includes(searchTerm) ||
            student.code.toLowerCase().includes(searchTerm);
    });

    // NUEVO: Buscador para el Historial
    const filteredHistory = historyData?.filter((item: any) => {
        const searchTerm = searchProject.toLowerCase();
        const student = getStudentInfoByNamespace(item.namespaceName);
        return item.name.toLowerCase().includes(searchTerm) ||
            student.name.toLowerCase().includes(searchTerm) ||
            student.code.toLowerCase().includes(searchTerm);
    });

    // NUEVO: Buscador para las Cuotas
    const filteredQuotas = pendingQuotas?.filter((q: any) => {
        const searchTerm = searchProject.toLowerCase();
        return q.studentName.toLowerCase().includes(searchTerm) ||
            q.studentCode.toLowerCase().includes(searchTerm);
    });


    const filteredStudents = students?.filter((s: any) =>
        s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
        s.code.toLowerCase().includes(searchStudent.toLowerCase())
    );

    const totalPages = Math.ceil((filteredStudents?.length || 0) / studentsPerPage);
    const paginatedStudents = filteredStudents?.slice(
        (currentPage - 1) * studentsPerPage,
        currentPage * studentsPerPage
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchStudent(e.target.value);
        setCurrentPage(1);
    };

    // Función para limpiar la pantalla central
    const resetMainView = () => {
        setSelectedPendingId(null);
        setSelectedQuotaRequest(null);
        setSelectedHistoryItem(null);
    };

    // Función inteligente para cambiar de pestaña
    const handleTabChange = (tab: 'deployments' | 'history' | 'quotas') => {
        setActiveSidebarTab(tab);
        resetMainView(); // Limpiamos el centro al cambiar de lado
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden font-sans">

            {/* --- NAVBAR ADMIN --- */}
            <nav className="flex-none w-full bg-[#0F172A] text-white px-6 h-16 flex items-center justify-between border-b border-slate-800 relative z-[60]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <Cloud className="h-6 w-6 text-blue-400" />
                        <span>PaaS Core Education</span>
                    </div>
                    <div className="h-6 w-px bg-slate-700 mx-2"></div>
                    {/* CORRECCIÓN 1: Botón "ADMIN CONSOLE" interactivo y más grande */}
                    <button
                        onClick={resetMainView} // <--- AHORA LIMPIA TODO
                        className="border border-slate-600 text-slate-300 font-mono text-xs font-bold tracking-wider px-3 py-1.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        ADMIN CONSOLE
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="mr-2">
                        <NotificationMenu />
                    </div>
                    <Avatar className="h-9 w-9 bg-indigo-100 text-indigo-700 cursor-pointer border-2 border-indigo-300 shadow-sm">
                        <AvatarFallback className="font-bold">{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    {/* CORRECCIÓN 3: Icono de LogOut */}
                    <button onClick={logout} className="text-slate-400 hover:text-red-400 ml-2 transition-colors" title="Cerrar sesión">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </nav>

            <div className="flex flex-1 min-h-0">

                {/* --- SIDEBAR IZQUIERDO --- */}
                <aside className="flex-none w-[380px] bg-[#F8FAFC] border-r border-slate-200 flex flex-col z-10">

                    <div className="p-6 pb-2 shrink-0">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-slate-900 text-lg">Solicitudes Pendientes</h2>
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 h-6 w-6 flex items-center justify-center rounded-full p-0">
                                {/* Muestra el total dinámico según la pestaña */}
                                {activeSidebarTab === 'deployments' ? (pendingProjects?.length || 0) : (pendingQuotas?.length || 0)}
                            </Badge>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <Button
                                variant={activeSidebarTab === 'deployments' ? 'default' : 'outline'}
                                onClick={() => handleTabChange('deployments')}
                                className={`flex-1 font-semibold shadow-sm h-9 ${activeSidebarTab === 'deployments' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
                            >
                                Despliegues
                            </Button>
                            <Button
                                variant={activeSidebarTab === 'history' ? 'default' : 'ghost'}
                                onClick={() => handleTabChange('history')}
                                className={`flex-1 h-9 ${activeSidebarTab === 'history' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                Historial
                            </Button>
                        </div>

                        <Button
                            variant={activeSidebarTab === 'quotas' ? 'default' : 'ghost'}
                            onClick={() => handleTabChange('quotas')}
                            className={`w-full justify-center h-9 mb-4 px-3 ${activeSidebarTab === 'quotas' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'text-slate-600'}`}
                        >
                            Aumento de Cuotas
                        </Button>

                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar proyecto o estudiante..."
                                value={searchProject}
                                onChange={(e) => setSearchProject(e.target.value)}
                                className="pl-9 bg-white border-slate-200 focus-visible:ring-slate-400 h-10 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 custom-scrollbar">
                        {activeSidebarTab === 'deployments' ? (
                            loadingPending ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin text-slate-400 h-6 w-6" />
                                </div>
                            ) : filteredProjects?.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                                    <FolderClock className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">No hay resultados.</p>
                                </div>
                            ) : (
                                filteredProjects?.map((project: any) => {
                                    const studentInfo = getStudentInfoByNamespace(project.namespaceName);

                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() => setSelectedPendingId(project.id)}
                                            className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all group relative ${selectedPendingId === project.id
                                                ? 'border-blue-500 ring-1 ring-blue-500'
                                                : 'border-slate-300 hover:border-blue-400'
                                                }`}
                                        >
                                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>

                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border border-white shadow-sm bg-indigo-100 text-indigo-700">
                                                    {studentInfo.initials}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">
                                                        {studentInfo.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        Cod: {studentInfo.code}
                                                    </p>
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600">
                                                {project.name}
                                            </h3>

                                            <p className="text-[11px] text-slate-500 capitalize">
                                                {project.architecture.replace("_", " ").toLowerCase()}
                                            </p>

                                            <p className="text-[10px] text-slate-400 mt-3 font-mono">
                                                {timeSince(project.createdAt)}
                                            </p>
                                        </div>
                                    );
                                })
                            )
                        ) : activeSidebarTab === 'history' ? (
                            /* --- LISTA DE HISTORIAL --- */
                            loadingHistory ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400 h-6 w-6" /></div>
                            ) : historyData?.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">El historial está vacío.</div>
                            ) : (
                                filteredHistory?.map((item: any) => {
                                    const studentInfo = getStudentInfoByNamespace(item.namespaceName);
                                    const isRejected = item.status === 'REJECTED';
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedHistoryItem(item)}
                                            className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${selectedHistoryItem?.id === item.id ? 'border-slate-800 ring-1 ring-slate-800' : 'border-slate-200 hover:border-slate-400'}`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                        {studentInfo.initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{studentInfo.name}</p>
                                                        <p className="text-[10px] text-slate-500">Cod: {studentInfo.code}</p>
                                                    </div>
                                                </div>
                                                {/* Badge Rojo o Verde */}
                                                <Badge className={`text-[10px] px-1.5 py-0 ${isRejected ? 'bg-red-50 text-red-700 hover:bg-red-50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'}`}>
                                                    {isRejected ? '✗ Rechazado' : '✓ Aprobado'}
                                                </Badge>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-1">{item.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-mono">Procesado: {timeSince(item.processedAt)}</p>
                                        </div>
                                    )
                                })
                            )
                        ) : (
                            /* --- LISTA DE CUOTAS --- */
                            pendingQuotas?.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    No hay solicitudes de cuota.
                                </div>
                            ) : (
                                filteredQuotas?.map((quota: any) => (
                                    <div
                                        key={quota.requestId}
                                        onClick={() => setSelectedQuotaRequest(quota)}
                                        className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all group relative ${selectedQuotaRequest?.requestId === quota.requestId
                                            ? 'border-purple-500 ring-1 ring-purple-500'
                                            : 'border-slate-300 hover:border-purple-400'
                                            }`}
                                    >
                                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-purple-400 animate-pulse"></div>

                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-100 text-purple-700">
                                                {getInitials(quota.studentName)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {quota.studentName}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    Cod: {quota.studentCode}
                                                </p>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-purple-600">
                                            Aumento de Recursos
                                        </h3>

                                        <p className="text-[10px] text-slate-500 leading-tight">
                                            Solicita {quota.requestedCpu} vCPU, {quota.requestedMemoryMb}MB RAM, {(quota.requestedStorageMb / 1024).toFixed(1)}GB Disco
                                        </p>

                                        <p className="text-[10px] text-slate-400 mt-3 font-mono">
                                            {timeSince(quota.createdAt)}
                                        </p>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </aside>

                {/* --- MAIN CONTENT DINÁMICO --- */}
                <main className="flex-1 bg-white flex flex-col min-w-0">
                    {selectedHistoryItem ? (
                        // VISTA 4: HISTORIAL (NUEVA)
                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <AdminHistoryReview
                                historyData={selectedHistoryItem}
                                studentInfo={getStudentInfoByNamespace(selectedHistoryItem.namespaceName)}
                                onFinished={() => setSelectedHistoryItem(null)}
                            />
                        </div>
                    ) : selectedQuotaRequest ? (

                        // VISTA 3: REVISIÓN DE CUOTAS
                        <div className="flex-1 min-h-0 relative flex flex-col">
                            <AdminQuotaReview
                                request={selectedQuotaRequest}
                                onFinished={() => setSelectedQuotaRequest(null)}
                            />
                        </div>

                    ) : selectedPendingId ? (

                        // VISTA 2: REVISIÓN DE PROYECTO PENDIENTE
                        <div className="flex-1 min-h-0 relative">
                            <AdminProjectReview
                                projectId={selectedPendingId}
                                studentInfo={getStudentInfoByNamespace(
                                    pendingProjects?.find((p: any) => p.id === selectedPendingId)?.namespaceName
                                )}
                                onFinished={() => setSelectedPendingId(null)}
                            />
                        </div>

                    ) : (

                        // VISTA 1: DIRECTORIO DE ESTUDIANTES
                        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-10">
                            <div className="flex justify-between items-end mb-8 shrink-0">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Directorio de Estudiantes</h1>
                                    <p className="text-slate-500 mt-1">Administra el acceso y cuotas de las cuentas.</p>
                                </div>

                                <div className="w-[350px] relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por nombre o código..."
                                        value={searchStudent}
                                        onChange={handleSearchChange}
                                        className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-slate-400 shadow-sm rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* TABLA */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col shrink-0">
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                    <div className="col-span-4">Estudiante</div>
                                    <div className="col-span-3">Código</div>
                                    <div className="col-span-3">Estado</div>
                                    <div className="col-span-2 text-right">Acciones</div>
                                </div>

                                <div className="divide-y divide-slate-100 bg-white">
                                    {loadingStudents ? (
                                        <div className="py-20 flex justify-center">
                                            <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
                                        </div>
                                    ) : paginatedStudents?.length === 0 ? (
                                        <div className="py-20 text-center text-slate-500">
                                            No se encontraron estudiantes.
                                        </div>
                                    ) : (
                                        paginatedStudents?.map((student: any) => (
                                            <div
                                                key={student.id}
                                                className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="col-span-4 flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border border-white shadow-sm bg-indigo-100 text-indigo-700">
                                                        {getInitials(student.name)}
                                                    </div>

                                                    <div className={!student.isActive ? "opacity-50" : ""}>
                                                        <p className="text-sm font-bold text-slate-900">{student.name}</p>
                                                        <p className="text-xs text-slate-500">{student.email}</p>
                                                    </div>
                                                </div>

                                                <div className={`col-span-3 ${!student.isActive ? "opacity-50" : ""}`}>
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-medium border border-slate-200">
                                                        {student.code}
                                                    </span>
                                                </div>

                                                <div className="col-span-3">
                                                    {student.isActive ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Habilitado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                            Inhabilitado
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="col-span-2 flex justify-end">
                                                    <button className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {filteredStudents && filteredStudents.length > 0 && (
                                <div className="flex items-center justify-between mt-4 text-xs text-slate-500 px-2 shrink-0">
                                    <p>
                                        Mostrando {(currentPage - 1) * studentsPerPage + 1}-
                                        {Math.min(currentPage * studentsPerPage, filteredStudents.length)}
                                        {" "}de {filteredStudents.length} estudiantes
                                    </p>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => p - 1)}
                                            disabled={currentPage === 1}
                                            className="h-8 text-xs bg-white hover:bg-slate-50"
                                        >
                                            Anterior
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className="h-8 text-xs bg-white hover:bg-slate-50"
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                    )}

                </main>
            </div>
        </div>
    );
};