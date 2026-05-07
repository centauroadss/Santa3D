'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Save, Settings, RefreshCw } from 'lucide-react';

export default function ConfiguracionAdminPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

    const [costos, setCostos] = useState({
        costo_una_categoria: '5',
        costo_ambas_categorias: '10',
        pago_banco: '',
        pago_cedula: '',
        pago_telefono: '',
        emails_bcc_general: ''
    });
    
    const [historico, setHistorico] = useState<any[]>([]);

    useEffect(() => {
        fetchConfig();
        fetchHistorico();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/configuracion', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCostos(res.data.data);
            } else {
                setError(res.data.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistorico = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/bcv-historico', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setHistorico(res.data.data);
            }
        } catch (err: any) {
            console.error('Error fetching historico:', err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.put('/api/admin/configuracion', costos, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setSuccess('Configuración guardada exitosamente');
                setTimeout(() => setSuccess(null), 3000);
                // Refrescar el historial porque los costos en Bs pueden haber cambiado
                fetchHistorico();
            } else {
                setError(res.data.error);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSyncBCV = async () => {
        setSyncing(true);
        setSyncError(null);
        setSyncSuccess(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post('/api/admin/bcv-historico', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSyncSuccess('Tasa BCV sincronizada exitosamente.');
                setTimeout(() => setSyncSuccess(null), 3000);
                fetchHistorico();
            } else {
                setSyncError(res.data.error);
            }
        } catch (err: any) {
            setSyncError(err.response?.data?.error || err.message);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return <div className="text-gray-500">Cargando configuración...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-brand-purple" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h1>
                    <p className="text-gray-500 text-sm">Gestiona los parámetros globales de la Copa 2026</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-200">
                    {success}
                </div>
            )}

            <Card className="p-6">
                <form onSubmit={handleSave} className="space-y-8">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Costos Dinámicos (USD)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Costo Una Categoría (Render o IA)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={costos.costo_una_categoria}
                                        onChange={(e) => setCostos({ ...costos, costo_una_categoria: e.target.value })}
                                        className="pl-8"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Precio base en dólares</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Costo Ambas Categorías
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={costos.costo_ambas_categorias}
                                        onChange={(e) => setCostos({ ...costos, costo_ambas_categorias: e.target.value })}
                                        className="pl-8"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Precio promocional por participar en ambas</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Receptor de Pago Móvil</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Banco</label>
                                <Input
                                    type="text"
                                    value={costos.pago_banco}
                                    onChange={(e) => setCostos({ ...costos, pago_banco: e.target.value })}
                                    placeholder="Ej: Banesco"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cédula o RIF</label>
                                <Input
                                    type="text"
                                    value={costos.pago_cedula}
                                    onChange={(e) => setCostos({ ...costos, pago_cedula: e.target.value })}
                                    placeholder="Ej: J123456789"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                                <Input
                                    type="text"
                                    value={costos.pago_telefono}
                                    onChange={(e) => setCostos({ ...costos, pago_telefono: e.target.value })}
                                    placeholder="Ej: 04140000000"
                                    required
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Estos datos se mostrarán en la página de pago como información de la cuenta destino.</p>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Configuración de Correos</h2>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Correos en Copia Oculta (BCC) Globales</label>
                            <Input
                                type="text"
                                value={costos.emails_bcc_general}
                                onChange={(e) => setCostos({ ...costos, emails_bcc_general: e.target.value })}
                                placeholder="ejemplo@correo.com, otro@correo.com"
                            />
                            <p className="text-xs text-gray-500 mt-2">Estos correos recibirán una copia oculta de todas las notificaciones del sistema (inscripciones, rechazos, validaciones). Separa varios correos con comas.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-brand-purple text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-purple/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </Card>

            <div className="mt-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Auditoría: Histórico de Tasas BCV</h2>
                    <div className="flex items-center gap-4">
                        {syncError && <span className="text-red-500 text-sm font-medium animate-pulse">{syncError}</span>}
                        {syncSuccess && <span className="text-green-600 text-sm font-medium animate-pulse">{syncSuccess}</span>}
                        <button
                            onClick={handleSyncBCV}
                            disabled={syncing}
                            className="bg-brand-purple/10 text-brand-purple px-4 py-2 rounded-lg font-medium hover:bg-brand-purple/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                            {syncing ? 'Sincronizando...' : 'Sincronizar BCV Ahora'}
                        </button>
                    </div>
                </div>
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-bold">Fecha</th>
                                    <th className="px-6 py-3 font-bold">Tasa Oficial BCV</th>
                                    <th className="px-6 py-3 font-bold text-brand-purple">1 Categoría (${costos.costo_una_categoria})</th>
                                    <th className="px-6 py-3 font-bold text-brand-purple">Ambas Categorías (${costos.costo_ambas_categorias})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-900">
                                {historico.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500 font-medium">
                                            No hay registros históricos todavía.
                                        </td>
                                    </tr>
                                ) : (
                                    historico.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap text-gray-900">
                                                {item.fecha ? new Date(item.fecha).toLocaleDateString('es-VE', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                }) : 'Fecha desconocida'}
                                            </td>
                                            <td className="px-6 py-3 font-medium text-gray-900">{item.tasaUsdBs ?? 'N/A'} Bs/$</td>
                                            <td className="px-6 py-3 font-bold text-gray-900">{item.costoUnaCategoriaBs ?? 'N/A'} Bs</td>
                                            <td className="px-6 py-3 font-bold text-gray-900">{item.costoAmbasCategoriasBs ?? 'N/A'} Bs</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
