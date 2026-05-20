'use client';

import { useState, useEffect } from 'react';
import { Mail, Edit2, Trash2, Plus, ArrowLeft, Save, MessageCircle, Monitor } from 'lucide-react';
import { wrapWithCentauroTemplate } from '@/lib/emails/centauro-template';

interface Plantilla {
    id: number;
    tipo: string;
    asunto: string;
    contenidoHtml: string;
    updatedAt: string;
}

const VARIABLES_DISPONIBLES = [
    { key: '{{nombre}}', label: 'Nombre del usuario' },
    { key: '{{categoria}}', label: 'Categoría' },
    { key: '{{montoBs}}', label: 'Monto en Bs' },
    { key: '{{telefonoPago}}', label: 'Teléfono de Pago' },
    { key: '{{enlace_subida}}', label: 'Enlace para Subir Video' },
];

export default function EmailClient() {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ tipo: '', asunto: '', contenidoHtml: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Preview state
    const [previewMode, setPreviewMode] = useState<'email' | 'whatsapp'>('email');

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

    const handleOpenEditor = (plantilla?: Plantilla) => {
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
        setIsEditing(true);
        setError(null);
    };

    const handleCloseEditor = () => {
        setIsEditing(false);
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
            handleCloseEditor();
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

    const insertVariable = (variable: string) => {
        setFormData((prev) => ({
            ...prev,
            contenidoHtml: prev.contenidoHtml + variable
        }));
    };

    // Replace variables with fake data for preview
    const getPreviewContent = () => {
        let content = formData.contenidoHtml
            .replace(/{{nombre}}/g, 'Juan Pérez')
            .replace(/{{categoria}}/g, 'Animación 3D Master')
            .replace(/{{montoBs}}/g, '150.00')
            .replace(/{{telefonoPago}}/g, '****-***-1234')
            .replace(/{{enlace_subida}}/g, '<a href="#" style="color: #FF3366;">Link de Subida</a>');
        
        return content;
    };

    // If in listing mode
    if (!isEditing) {
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
                        onClick={() => handleOpenEditor()}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-purple text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-brand-purple/20"
                    >
                        <Plus size={20} />
                        Nueva Plantilla
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {loading && plantillas.length === 0 ? (
                    <div className="text-center py-12">Cargando plantillas...</div>
                ) : (
                    <div className="grid gap-4">
                        {plantillas.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
                                No hay plantillas configuradas.
                            </div>
                        ) : (
                            plantillas.map((plantilla) => (
                                <div key={plantilla.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:shadow-md transition-shadow">
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
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleOpenEditor(plantilla)}
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
                )}
            </div>
        );
    }

    // Editing mode (Split Screen)
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-gray-50 -m-4 sm:-m-6 lg:-m-8 rounded-xl overflow-hidden shadow-inner">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleCloseEditor}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-black text-gray-900">
                        {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleCloseEditor}
                        disabled={isSaving}
                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-purple text-white rounded-xl font-bold hover:bg-opacity-90 transition-colors shadow-lg shadow-brand-purple/20 disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar</>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="m-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
                    {error}
                </div>
            )}

            {/* Split Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Editor */}
                <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200 bg-white">
                    <form id="email-form" onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Tipo de Plantilla (Identificador Único)</label>
                            <input
                                type="text"
                                required
                                disabled={!!editingId} // No se puede cambiar el tipo si se está editando
                                placeholder="ej. BIENVENIDA, VIDEO_RECIBIDO"
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value.toUpperCase() })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple uppercase disabled:opacity-50 font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">Usado por el backend para buscar esta plantilla.</p>
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

                        <div className="space-y-3 flex-grow flex flex-col">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-gray-700">Contenido HTML / Texto Wapp</label>
                            </div>
                            
                            {/* Quick variables */}
                            <div className="flex flex-wrap gap-2">
                                {VARIABLES_DISPONIBLES.map(v => (
                                    <button
                                        key={v.key}
                                        type="button"
                                        onClick={() => insertVariable(v.key)}
                                        className="text-xs px-2 py-1 bg-brand-purple/10 text-brand-purple rounded-md font-mono hover:bg-brand-purple hover:text-white transition-colors"
                                        title={v.label}
                                    >
                                        {v.key}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                required
                                placeholder="<p>Hola {{nombre}}</p>..."
                                value={formData.contenidoHtml}
                                onChange={(e) => setFormData({ ...formData, contenidoHtml: e.target.value })}
                                className="w-full p-4 h-[400px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple font-mono text-sm resize-y"
                            />
                            <p className="text-xs text-gray-500">
                                Escribe código HTML válido para correos. Si usas etiquetas como <code>&lt;div class="button-container"&gt;&lt;a class="button"&gt;</code>, el Wrapper de Centauro las estilizará.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Right Panel: Preview */}
                <div className="w-1/2 bg-gray-100 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            Vista Previa en Tiempo Real
                        </h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setPreviewMode('email')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${previewMode === 'email' ? 'bg-white shadow-sm text-brand-purple' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Monitor size={16} />
                                Correo
                            </button>
                            <button
                                onClick={() => setPreviewMode('whatsapp')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${previewMode === 'whatsapp' ? 'bg-white shadow-sm text-[#25D366]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <MessageCircle size={16} />
                                WhatsApp
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
                        {previewMode === 'email' ? (
                            <div className="w-full max-w-[640px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-full flex flex-col">
                                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 text-sm">
                                    <div className="text-gray-500"><span className="font-bold">De:</span> Copa 2026 Centauro &lt;no-reply@centauroads.com&gt;</div>
                                    <div className="text-gray-500"><span className="font-bold">Para:</span> Juan Pérez &lt;juan@example.com&gt;</div>
                                    <div className="text-gray-900 mt-1"><span className="font-bold text-gray-500">Asunto:</span> {formData.asunto || '(Sin Asunto)'}</div>
                                </div>
                                <div className="flex-1 bg-white">
                                    <iframe 
                                        srcDoc={wrapWithCentauroTemplate(getPreviewContent())} 
                                        className="w-full h-full border-none"
                                        title="Email Preview"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-sm h-[600px] bg-[#efeae2] rounded-3xl shadow-2xl border-8 border-gray-900 overflow-hidden relative flex flex-col">
                                {/* Wapp Header */}
                                <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shrink-0 z-10">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                        <img src="/centauro-logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                                    </div>
                                    <div>
                                        <div className="font-bold">Copa Santa 3D</div>
                                        <div className="text-xs opacity-80">Cuenta oficial de empresa</div>
                                    </div>
                                </div>
                                {/* Wapp Background Pattern */}
                                <div className="absolute inset-0 opacity-[0.06] z-0" style={{backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")'}}></div>
                                
                                {/* Wapp Chat Area */}
                                <div className="flex-1 overflow-y-auto p-4 z-10 flex flex-col">
                                    <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%] self-start relative">
                                        {/* Wapp tail */}
                                        <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>
                                        
                                        <div className="text-[14.2px] text-[#111b21] leading-[19px] whitespace-pre-wrap font-sans break-words" 
                                             dangerouslySetInnerHTML={{__html: getPreviewContent().replace(/<[^>]+>/g, '')}} />
                                        
                                        <div className="text-[11px] text-gray-500 text-right mt-1">12:00</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
