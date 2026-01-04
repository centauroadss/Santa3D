'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, Clock, Key, User, Activity, AlertTriangle, Terminal } from 'lucide-react';
import Card from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
    id: string;
    action: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL';
    details: string;
    targetName?: string;
    targetEmail?: string;
    issuer: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

interface SecurityUser {
    id: string;
    name: string;
    email: string;
    isDefault: boolean;
    resetRequested: boolean;
    lastUpdate: string;
}

interface SecurityData {
    logs: AuditLog[];
    users: SecurityUser[];
}

export default function AdminSecurityPage() {
    const [data, setData] = useState<SecurityData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/system/audit-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Auto-refresh every 15s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-400 font-mono text-xs">INITIALIZING_SECURITY_MODULE...</div>;

    const pendingResets = data?.users.filter(u => u.resetRequested).length || 0;
    const defaultCount = data?.users.filter(u => u.isDefault).length || 0;
    const secureCount = data?.users.filter(u => !u.isDefault).length || 0;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <div className="bg-slate-900 text-white shadow-xl p-4 border-b-4 border-brand-purple">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-widest flex items-center gap-3">
                        <Terminal className="text-brand-purple" />
                        SISTEMA DE AUDITORÍA Y SEGURIDAD
                    </h1>
                    <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        SYSTEM_ONLINE
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8">

                {/* Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className={`border-l-4 ${pendingResets > 0 ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-gray-300'}`}>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Solicitudes Críticas</div>
                        <div className={`text-4xl font-black ${pendingResets > 0 ? 'text-red-600' : 'text-gray-400'}`}>{pendingResets}</div>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Recuperación Pendiente</p>
                    </Card>

                    <Card className="bg-white border-l-4 border-orange-400">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Riesgo Medio</div>
                        <div className="text-4xl font-black text-orange-500">{defaultCount}</div>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Claves Default (Centauro2025)</p>
                    </Card>

                    <Card className="bg-white border-l-4 border-green-500">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Seguridad Óptima</div>
                        <div className="text-4xl font-black text-green-600">{secureCount}</div>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Claves Personalizadas</p>
                    </Card>

                    <Card className="bg-white border-l-4 border-blue-600">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Traza de Auditoría</div>
                        <div className="text-4xl font-black text-blue-700">{data?.logs.length}</div>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Eventos Registrados</p>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Tabla de Usuarios (Left 5 Cols) */}
                    <div className="lg:col-span-12 xl:col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2 uppercase tracking-wide">
                                <User size={14} /> Usuarios del Sistema
                            </h3>
                        </div>
                        <div className="overflow-x-auto flex-grow">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100 text-gray-500 font-bold uppercase border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Juez / Email</th>
                                        <th className="px-3 py-2 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data?.users.map(u => (
                                        <tr key={u.id} className={`hover:bg-gray-50 ${u.resetRequested ? 'bg-red-50/50' : ''}`}>
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-gray-800">{u.name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                                                {u.resetRequested && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] text-red-600 font-bold uppercase animate-pulse">
                                                            ⚠ Solicitó Reinicio
                                                        </span>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`¿Restablecer contraseña para ${u.name}?`)) return;
                                                                try {
                                                                    const token = localStorage.getItem('admin_token');
                                                                    await axios.post(`/api/judges/${u.id}/reset-password`, {}, {
                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                    });
                                                                    alert('Contraseña restablecida a "Centauro2025"');
                                                                    fetchData(); // Refresh
                                                                } catch (e) {
                                                                    alert('Error al restablecer');
                                                                }
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700 text-white text-[9px] px-2 py-0.5 rounded shadow-sm transition-colors"
                                                        >
                                                            APROBAR RESET
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {u.isDefault ? (
                                                    <span className="inline-flex flex-col items-center gap-0.5">
                                                        <ShieldAlert size={14} className="text-orange-500" />
                                                        <span className="text-[9px] text-orange-600 font-bold">DEFAULT</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex flex-col items-center gap-0.5">
                                                        <ShieldCheck size={14} className="text-green-600" />
                                                        <span className="text-[9px] text-green-700 font-bold">SECURE</span>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bitácora / Logs (Right 7 Cols) */}
                    <div className="lg:col-span-12 xl:col-span-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2 uppercase tracking-wide">
                                <Activity size={14} /> Bitácora Forense (Logs)
                            </h3>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                            <table className="w-full text-xs font-mono">
                                <thead className="bg-gray-900 text-gray-300 font-bold uppercase sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left w-24">Tiempo</th>
                                        <th className="px-3 py-2 text-center w-20">Nivel</th>
                                        <th className="px-3 py-2 text-left w-32">Acción</th>
                                        <th className="px-3 py-2 text-left">Detalles (Traza)</th>
                                        <th className="px-3 py-2 text-left w-24">Actor (IP)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data?.logs.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">System initialization... No logs found.</td></tr>
                                    ) : (
                                        data?.logs.map(log => (
                                            <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-3 py-2 text-[10px] text-gray-500 whitespace-nowrap border-r border-gray-100">
                                                    {format(new Date(log.createdAt), 'dd MMM HH:mm:ss', { locale: es })}
                                                </td>
                                                <td className="px-3 py-2 text-center border-r border-gray-100">
                                                    <Badge severity={log.severity} />
                                                </td>
                                                <td className="px-3 py-2 font-bold text-gray-700 border-r border-gray-100">
                                                    {log.action}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">
                                                    <div className="font-bold text-gray-800">{log.details}</div>
                                                    {log.targetEmail && (
                                                        <div className="text-[10px] text-blue-600">
                                                            Afectado: <span className="font-bold">{log.targetEmail}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-[10px] text-gray-400 truncate max-w-[150px]" title={`${log.issuer} - UA: ${log.userAgent}`}>
                                                    <div>{log.issuer ? log.issuer.split('@')[0] : 'System'}</div>
                                                    <div className="text-[9px]">{log.ipAddress || '127.0.0.1'}</div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function Badge({ severity }: { severity: string }) {
    if (severity === 'CRITICAL') return <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-black border border-red-200">CRIT</span>;
    if (severity === 'WARN') return <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-200">WARN</span>;
    return <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">INFO</span>;
}
