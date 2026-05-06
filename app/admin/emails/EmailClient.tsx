'use client';

import { useState, useEffect } from 'react';
import { Mail, Edit2, Trash2, Plus, X, Save } from 'lucide-react';

interface Plantilla {
    id: number;
    tipo: string;
    asunto: string;
    contenidoHtml: string;
    updatedAt: string;
}

export default function EmailClient() {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ tipo: '', asunto: '', contenidoHtml: '' });
    const [isSaving, setIsSaving] = useState(false);

    const fetchPlantillas = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/emails');
            if (!res.ok) throw new Error('Error al cargar plantillas');
            const data = await res.json();
            setPlantillas(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlantillas();
    }, []);

    const handleOpenModal = (plantilla?: Plantilla) => {
        if (plantilla) {
            setEditingId(plantilla.id);
            setFormData({
                tipo: plantilla.tipo,
                asunto: plantilla.asunto,
                contenidoHtml: plantilla.contenidoHtml
            });
        } else {
            setEditingId(null);
            setFormData({ tipo: '', asunto: '', contenidoHtml: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ tipo: '', asunto: '', contenidoHtml: '' });
        setError(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const url = '/api/admin/emails';
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { id: editingId, ...formData } : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al guardar');
            }

            await fetchPlantillas();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
        
        try {
            const res = await fetch(`/api/admin/emails?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            await fetchPlantillas();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading && plantillas.length === 0) {
        return <div className="text-center py-12">Cargando plantillas...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Mail className="text-brand-purple" size={28} />
                        Plantillas de Correo y Mensajes
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gestiona los correos automáticos (inscripción, validación, jueces) y mensajes de WhatsApp.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-purple text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-brand-purple/20"
                >
                    <Plus size={20} />
                    Nueva Plantilla
                </button>
            </div>

            {error && !isModalOpen && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid gap-4">
                {plantillas.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
                        No hay plantillas configuradas.
                    </div>
                ) : (
                    plantillas.map((plantilla) => (
                        <div key={plantilla.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-brand-purple/10 text-brand-purple font-bold text-xs rounded-full">
                                        {plantilla.tipo}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        Actualizado: {new Date(plantilla.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{plantilla.asunto}</h3>
                                <p className="text-gray-500 text-sm mt-1 line-clamp-2 bg-gray-50 p-2 rounded-lg font-mono">
                                    {plantilla.contenidoHtml}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(plantilla)}
                                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(plantilla.id)}
                                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-grow">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}

                            <form id="email-form" onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Tipo de Plantilla (Identificador Único)</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!!editingId} // No se puede cambiar el tipo si se está editando
                                            placeholder="ej. BIENVENIDA, VIDEO_RECIBIDO"
                                            value={formData.tipo}
                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value.toUpperCase() })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple uppercase disabled:opacity-50"
                                        />
                                        <p className="text-xs text-gray-500">Ejemplos: BIENVENIDA, VIDEO_RECIBIDO, WAPP_RECORDATORIO.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Asunto (Correo) / Título Interno (Wapp)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="ej. ¡Bienvenido al Concurso!"
                                            value={formData.asunto}
                                            onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 flex-grow flex flex-col h-96">
                                    <div className="flex justify-between items-end">
                                        <label className="text-sm font-bold text-gray-700">Contenido HTML / Texto Wapp</label>
                                        <span className="text-xs text-gray-500">Usa variables como {'{{nombre}}'}, {'{{categoria}}'}</span>
                                    </div>
                                    <textarea
                                        required
                                        placeholder="<h1>Hola {{nombre}}</h1>..."
                                        value={formData.contenidoHtml}
                                        onChange={(e) => setFormData({ ...formData, contenidoHtml: e.target.value })}
                                        className="w-full p-4 flex-grow bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-mono text-sm resize-none"
                                    />
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="email-form"
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-brand-purple text-white rounded-xl font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Plantilla</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
