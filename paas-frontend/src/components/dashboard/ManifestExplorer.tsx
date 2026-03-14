import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { BookOpen, Code2, ShieldAlert, Database, Server, Monitor, LayoutGrid, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MANIFEST_GUIDES } from '@/data/manifestGuides.ts'; // Importamos el diccionario
import { Button } from '../ui/button';

// Función para clasificar y organizar los YAMLs
const parseManifests = (manifestsStr: string[]) => {
    const categories: Record<string, any[]> = {
        'Database (db)': [],
        'Backend (back)': [],
        'Frontend (front)': [],
        'Networking': [],
        'Security': [],
        'Otros': []
    };

    manifestsStr.forEach((yaml, index) => {
        const lines = yaml.split('\n');
        const kind = lines.find(l => l.startsWith('kind:'))?.split(':')[1]?.trim() || 'Unknown';
        const name = lines.find(l => l.startsWith('  name:'))?.split(':')[1]?.trim() || `resource-${index}`;

        let category = 'Otros';
        if (kind === 'NetworkPolicy') category = 'Security';
        else if (kind === 'Ingress') category = 'Networking';
        else if (name.includes('front') || name.includes('monolith')) category = 'Frontend (front)';
        else if (name.includes('back')) category = 'Backend (back)';
        else if (name.includes('db')) category = 'Database (db)';

        categories[category].push({ id: `${kind}-${name}`, name: `${name}.yaml`, kind, yaml });
    });

    // Limpiar categorías vacías
    Object.keys(categories).forEach(key => { if (categories[key].length === 0) delete categories[key]; });
    return categories;
};

export const ManifestExplorer = ({ project, onBack, isAdmin = false }: { project: any, onBack: () => void, isAdmin?: boolean }) => {
    const categories = useMemo(() => parseManifests(project.generatedManifests || []), [project.generatedManifests]);

    // Seleccionar el primer manifiesto por defecto
    const firstCategory = Object.keys(categories)[0];
    const firstManifest = categories[firstCategory]?.[0];

    const [selectedManifest, setSelectedManifest] = useState<any>(firstManifest);
    const [activeTab, setActiveTab] = useState<'code' | 'guide'>('code');

    const guideData = MANIFEST_GUIDES[selectedManifest?.kind] || {
        title: `Entendiendo ${selectedManifest?.kind || 'este recurso'}`,
        whatIsIt: 'Este es un recurso estándar de Kubernetes generado por el orquestador.',
        params: [],
        note: 'Explora el código fuente para ver la configuración exacta.'
    };

    return (
        // CONTENEDOR PRINCIPAL ABSOLUTO
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-50">

            {/* BREADCRUMB (Header Fijo Superior) */}
            {!isAdmin && (
                <div className="flex-none bg-white border-b border-slate-200 px-8 py-3 flex items-center text-sm text-slate-500 shadow-sm relative z-10">
                    <span className="hover:text-slate-900 cursor-pointer flex items-center gap-2" onClick={onBack}>
                        <FolderIcon /> Mis Proyectos
                    </span>
                    <span className="mx-2">/</span>
                    <span className="hover:text-slate-900 cursor-pointer" onClick={onBack}>{project.name}</span>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-blue-600 flex items-center gap-1"><FileCode2 className="h-4 w-4" /> Manifiestos</span>
                </div>
            )}
            {/* CUERPO INFERIOR DIVIDIDO EN 2 COLUMNAS */}
            <div className="flex-1 flex min-h-0">

                {/* COLUMNA IZQUIERDA: SIDEBAR EXPLORADOR */}
                <div className="flex-none w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 custom-scrollbar">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-4 uppercase">Explorer</p>
                    <div className="space-y-6">
                        {Object.entries(categories).map(([catName, files]) => (
                            <div key={catName}>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                                    {catName.includes('Database') && <Database className="h-3 w-3" />}
                                    {catName.includes('Backend') && <Server className="h-3 w-3" />}
                                    {catName.includes('Frontend') && <Monitor className="h-3 w-3" />}
                                    {catName.includes('Security') && <ShieldAlert className="h-3 w-3" />}
                                    {catName.includes('Networking') && <LayoutGrid className="h-3 w-3" />}
                                    {catName}
                                </div>
                                <div className="space-y-1 pl-2 border-l-2 border-slate-200 ml-1.5">
                                    {files.map(file => (
                                        <button
                                            key={file.id}
                                            onClick={() => setSelectedManifest(file)}
                                            className={cn("w-full text-left px-3 py-1.5 text-xs font-mono rounded-md transition-colors flex items-center gap-2",
                                                selectedManifest?.id === file.id ? "bg-blue-100 text-blue-700 font-semibold" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                            )}
                                        >
                                            <span className={cn("h-1.5 w-1.5 rounded-full", selectedManifest?.id === file.id ? "bg-blue-600" : "bg-slate-300")}></span>
                                            {file.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* BOTÓN REGRESAR PARA ADMIN (NUEVO) */}
                    {isAdmin && (
                        <div className="mt-auto pt-8 pb-4">
                            <Button onClick={onBack} className="w-full bg-[#0F172A] hover:bg-slate-800 text-white">
                                &larr; Regresar
                            </Button>
                        </div>
                    )}
                </div>


                {/* COLUMNA DERECHA: ÁREA PRINCIPAL (TABS + CONTENIDO) */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">

                    {/* TABS SUPERIORES (Header Fijo Interno) */}
                    <div className="flex-none flex border-b border-slate-200 px-4 bg-slate-50/50">
                        <button
                            onClick={() => setActiveTab('code')}
                            className={cn("flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors", activeTab === 'code' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}
                        >
                            <Code2 className="h-4 w-4" /> Código Fuente
                        </button>
                        <button
                            onClick={() => setActiveTab('guide')}
                            className={cn("flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors", activeTab === 'guide' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}
                        >
                            <BookOpen className="h-4 w-4" /> Guía Explicativa
                        </button>
                    </div>

                    {/* CONTENIDO DE LA PESTAÑA (Área con scroll propio) */}
                    <div className="flex-1 min-h-0 relative">
                        {activeTab === 'code' ? (
                            <Editor
                                height="100%"
                                defaultLanguage="yaml"
                                theme="light"
                                value={selectedManifest?.yaml}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    wordWrap: "on",
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        ) : (
                            <div className="h-full overflow-y-auto p-12 animate-in fade-in slide-in-from-bottom-4">
                                <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{guideData.title}</h1>
                                <p className="text-slate-500 font-mono text-sm mb-8 pb-8 border-b border-slate-200">Archivo: {selectedManifest?.name} | Recurso: <span className="text-purple-600 font-bold bg-purple-50 px-1 rounded">{selectedManifest?.kind}</span></p>

                                <h2 className="text-2xl font-bold text-slate-900 mb-4">¿Qué es este recurso?</h2>
                                <p className="text-slate-600 leading-relaxed mb-10 text-lg">{guideData.whatIsIt}</p>

                                {guideData.params.length > 0 && (
                                    <>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Análisis de parámetros clave</h2>
                                        <div className="space-y-4 mb-12">
                                            {guideData.params.map((param: any, i: number) => (
                                                <div key={i} className="flex gap-6 p-4 rounded-xl border border-slate-100 bg-slate-50">
                                                    <code className="text-blue-600 font-bold text-sm shrink-0 mt-0.5">{param.name}</code>
                                                    <p className="text-sm text-slate-600 leading-relaxed">{param.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl relative overflow-hidden mb-10">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                                        <BookOpen className="h-5 w-5" /> Nota de Arquitectura
                                    </h3>
                                    <p className="text-sm text-blue-800 leading-relaxed">{guideData.note}</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>;