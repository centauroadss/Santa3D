'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, Plus, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ConcursoConfig {
    id: string;
    nombre: string;
    descripcion: string;
}

interface InscripcionConfig {
    aplica: boolean;
    alcance: 'uno' | 'varios' | 'todos';
    concursos: ConcursoConfig[];
    montoUsd: number;
}

export default function InscripcionConfigPage() {
    const [config, setConfig] = useState<InscripcionConfig>({
        aplica: true,
        alcance: 'todos',
        concursos: [
            { id: 'RENDER', nombre: 'Concurso Render', descripcion: 'Competencia de Renderizado 3D Tradicional' },
            { id: 'IA', nombre: 'Concurso IA', descripcion: 'Competencia usando Inteligencia Artificial' }
        ],
        montoUsd: 5
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await axios.get('/api/admin/inscripcion-config');
            if (res.data.config) {
                setConfig(res.data.config);
            }
        } catch (error) {
            console.error('Error cargando config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage({ text: '', type: '' });
            await axios.post('/api/admin/inscripcion-config', { config });
            setMessage({ text: 'Configuración guardada exitosamente.', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Error al guardar la configuración.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const addConcurso = () => {
        setConfig({
            ...config,
            concursos: [...config.concursos, { id: `CAT_${Date.now()}`, nombre: '', descripcion: '' }]
        });
    };

    const removeConcurso = (index: number) => {
        const newConcursos = [...config.concursos];
        newConcursos.splice(index, 1);
        setConfig({ ...config, concursos: newConcursos });
    };

    const updateConcurso = (index: number, field: keyof ConcursoConfig, value: string) => {
        const newConcursos = [...config.concursos];
        newConcursos[index] = { ...newConcursos[index], [field]: value };
        setConfig({ ...config, concursos: newConcursos });
    };

    if (loading) return <div className="p-8 text-gray-900">Cargando configuración...</div>;

    return (
        <div className="p-6 md:p-8 text-gray-900">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-brand-purple/20 text-brand-purple rounded-xl">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black">Configuración de Inscripción</h1>
                    <p className="text-gray-600">Administra los costos y parámetros de la inscripción al concurso.</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Parámetros Principales">
                        <div className="space-y-6">
                            <label className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={config.aplica}
                                    onChange={(e) => setConfig({ ...config, aplica: e.target.checked })}
                                    className="w-5 h-5 text-brand-purple rounded border-gray-600 bg-gray-700 focus:ring-brand-purple"
                                />
                                <div>
                                    <p className="font-bold">Aplica Costo de Inscripción</p>
                                    <p className="text-sm text-gray-600">Si se desactiva, la inscripción será gratuita.</p>
                                </div>
                            </label>

                            {config.aplica && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Aplica Para:</label>
                                            <select 
                                                value={config.alcance}
                                                onChange={(e) => setConfig({ ...config, alcance: e.target.value as any })}
                                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
                                            >
                                                <option value="todos">Todos los concursos (Tarifa Plana)</option>
                                                <option value="varios">Varios concursos (Seleccionados)</option>
                                                <option value="uno">Un solo concurso</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Monto (USD):</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={config.montoUsd}
                                                    onChange={(e) => setConfig({ ...config, montoUsd: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-[#111] border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-brand-purple font-mono"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2">El sistema multiplicará esto por la tasa BCV del día.</p>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-sm font-bold text-gray-700">Concursos Disponibles:</label>
                                            <button onClick={addConcurso} className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                                                <Plus size={14} /> Añadir Concurso
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {config.concursos.map((c, idx) => (
                                                <div key={idx} className="flex gap-4 items-start p-4 bg-[#111] rounded-lg border border-white/5 relative group">
                                                    <div className="flex-1 space-y-3">
                                                        <input 
                                                            type="text" 
                                                            value={c.nombre}
                                                            onChange={(e) => updateConcurso(idx, 'nombre', e.target.value)}
                                                            placeholder="Nombre del Concurso (Ej: Render, IA)"
                                                            className="w-full bg-transparent border-b border-white/10 px-2 py-1 focus:outline-none focus:border-brand-purple font-bold text-white"
                                                        />
                                                        <input 
                                                            type="text" 
                                                            value={c.descripcion}
                                                            onChange={(e) => updateConcurso(idx, 'descripcion', e.target.value)}
                                                            placeholder="Descripción breve..."
                                                            className="w-full bg-transparent border-b border-white/10 px-2 py-1 focus:outline-none focus:border-brand-purple text-sm text-gray-400"
                                                        />
                                                        <div className="text-xs text-gray-600 px-2 font-mono">ID: {c.id}</div>
                                                    </div>
                                                    <button onClick={() => removeConcurso(idx)} className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg opacity-50 group-hover:opacity-100 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            {config.concursos.length === 0 && (
                                                <p className="text-gray-500 text-sm text-center py-4 border border-dashed border-white/10 rounded-lg">No hay concursos configurados.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
                <div>
                    <Card title="Acciones">
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            {saving ? 'Guardando...' : <><Save size={20} /> Guardar Cambios</>}
                        </Button>
                        <div className="mt-6 p-4 bg-brand-purple/10 border border-brand-purple/20 rounded-lg">
                            <h3 className="font-bold text-brand-purple mb-2">Nota Importante</h3>
                            <p className="text-sm text-gray-700">
                                Al guardar estos cambios, se actualizarán las categorías disponibles en la pantalla de inicio y el monto validado por el OCR en las inscripciones de pago móvil.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
