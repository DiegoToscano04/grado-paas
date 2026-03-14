import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { cn } from '@/lib/utils';

export const NotificationMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // 1. Traer notificaciones en segundo plano cada 15 segundos
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications');
            return res.data;
        },
        refetchInterval: 15000
    });

    // Contar cuántas no se han leído
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    // Lógica para cerrar el menú si hacemos clic afuera de él
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Marcar una notificación específica como leída
    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Actualiza el contador
        } catch (error) {
            console.error("Error marcando como leída", error);
        }
    };

    // Marcar todas como leídas
    const markAllAsRead = async () => {
        const unread = notifications.filter((n: any) => !n.isRead);
        for (const n of unread) {
            await markAsRead(n.id);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* EL BOTÓN DE LA CAMPANITA */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-400 hover:text-slate-600 relative p-2 transition-colors rounded-full hover:bg-slate-100"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
            </button>

            {/* EL MENÚ DESPLEGABLE */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                                <Check className="h-3 w-3" /> Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                <Bell className="h-8 w-8 opacity-20" />
                                No tienes notificaciones nuevas.
                            </div>
                        ) : (
                            notifications.map((notif: any) => (
                                <div
                                    key={notif.id}
                                    onClick={() => { if (!notif.isRead) markAsRead(notif.id) }}
                                    className={cn(
                                        "p-4 border-b border-slate-50 cursor-pointer transition-colors flex gap-3 hover:bg-slate-50",
                                        !notif.isRead ? "bg-blue-50/30" : "opacity-75"
                                    )}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        {/* Icono dinámico según la palabra clave en el título */}
                                        {notif.title.includes("Error") || notif.title.includes("Rechazad") ? (
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                        ) : notif.title.includes("Exitoso") || notif.title.includes("Aprobada") || notif.title.includes("Eliminado") ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <Info className="h-5 w-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm mb-1 truncate", !notif.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>
                                            {notif.title}
                                        </p>


                                        <p className="text-xs text-slate-600 leading-relaxed break-all line-clamp-3">
                                            {notif.message}
                                        </p>

                                        <p className="text-[10px] text-slate-400 mt-2 font-mono">
                                            {new Date(notif.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    {/* El puntito azul indica que no la has leído */}
                                    {!notif.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2 shadow-sm shadow-blue-200"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};