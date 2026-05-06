'use client';

import { useState, useEffect } from 'react';

export default function EmailConfigAndLogs() {
    const [config, setConfig] = useState({
        url_adjunto_registro_video: '',
        url_adjunto_certificado: '',
        url_adjunto_bienvenida_juez: '',
        url_adjunto_agradecimiento_juez: ''
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [configRes, logsRes] = await Promise.all([
                fetch('/api/admin/emails/config'),
                fetch('/api/admin/emails/logs')
            ]);
            
            const configData = await configRes.json();
            const logsData = await logsRes.json();

            if (configData.success) setConfig(configData.data);
            if (logsData.success) setLogs(logsData.data);
        } catch (error) {
            console.error('Error fetching email data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/emails/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await res.json();
            if (data.success) {
                setMessage('Configuración guardada exitosamente.');
            } else {
                setMessage('Error al guardar configuración: ' + data.error);
            }
        } catch (error: any) {
            setMessage('Error de red: ' + error.message);
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('es-VE');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ENVIADO': return 'bg-blue-100 text-blue-800';
            case 'ENTREGADO': return 'bg-yellow-100 text-yellow-800';
            case 'LEIDO': return 'bg-green-100 text-green-800';
            case 'REBOTADO': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando módulo de correos...</div>;

    return (
        <div className="space-y-10 mt-10">
            {/* Configuración de Adjuntos */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">1. Enlaces a Archivos Adjuntos</h3>
                    <p className="text-sm text-gray-500 mt-1">Ingresa el enlace directo (URL pública) del archivo (PDF, Imagen, etc) que se adjuntará nativamente en cada tipo de correo. Los archivos deben pesar menos de 20MB.</p>
                </div>
                
                <form onSubmit={handleSaveConfig} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL - Constancia de Registro de Video (Concursante)
                            </label>
                            <input
                                type="url"
                                value={config.url_adjunto_registro_video}
                                onChange={(e) => setConfig({ ...config, url_adjunto_registro_video: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#85439a] focus:border-[#85439a] text-sm"
                                placeholder="https://mi-servidor.com/instrucciones.pdf"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL - Certificado de Participación
                            </label>
                            <input
                                type="url"
                                value={config.url_adjunto_certificado}
                                onChange={(e) => setConfig({ ...config, url_adjunto_certificado: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#85439a] focus:border-[#85439a] text-sm"
                                placeholder="https://mi-servidor.com/certificado.pdf"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL - Bienvenida a Juez (Hoja de Ruta)
                            </label>
                            <input
                                type="url"
                                value={config.url_adjunto_bienvenida_juez}
                                onChange={(e) => setConfig({ ...config, url_adjunto_bienvenida_juez: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#85439a] focus:border-[#85439a] text-sm"
                                placeholder="https://mi-servidor.com/guia-jueces.pdf"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL - Agradecimiento a Juez (Reporte Final)
                            </label>
                            <input
                                type="url"
                                value={config.url_adjunto_agradecimiento_juez}
                                onChange={(e) => setConfig({ ...config, url_adjunto_agradecimiento_juez: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#85439a] focus:border-[#85439a] text-sm"
                                placeholder="https://mi-servidor.com/reporte-final.pdf"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#85439a] text-white px-4 py-2 rounded-md shadow-sm hover:bg-[#6c367d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85439a] disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar Enlaces'}
                        </button>
                        {message && (
                            <span className={`text-sm font-medium ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                {message}
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {/* Monitor de Envíos */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">2. Monitor de Envíos (Logs)</h3>
                        <p className="text-sm text-gray-500 mt-1">Historial de correos enviados y confirmaciones de lectura gracias al Webhook de Resend.</p>
                    </div>
                    <button onClick={fetchData} className="text-[#85439a] hover:text-[#6c367d] text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Refrescar Logs
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatario / Asunto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregado/Leído</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No hay registros de correos enviados aún.
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{log.to}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{log.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{log.tipo}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {log.deliveredAt && <div><span className="font-medium text-gray-700">Entregado:</span> {formatDate(log.deliveredAt)}</div>}
                                        {log.openedAt && <div className="mt-1"><span className="font-medium text-green-700">Leído:</span> {formatDate(log.openedAt)}</div>}
                                        {!log.deliveredAt && !log.openedAt && '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
