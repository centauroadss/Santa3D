'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Trash2, Edit, Plus, AlertTriangle } from 'lucide-react';

interface Criterion {
    id: string;
    nombre: string;
    descripcion: string;
    peso: number;
    orden: number;
}

export default function AdminCriteriaPage() {
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<Criterion> | null>(null);
    const router = useRouter();

    const fetchCriteria = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/criteria', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCriteria(res.data.data);
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('Error cargando criterios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCriteria();
    }, []);

    const totalWeight = criteria.reduce((sum, item) => sum + item.peso, 0);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este criterio?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(`/api/admin/criteria/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCriteria();
        } catch (e) {
            alert('Error al eliminar');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            if (currentItem?.id) {
                await axios.put(`/api/admin/criteria/${currentItem.id}`, currentItem, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/admin/criteria', currentItem, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsEditing(false);
            setCurrentItem(null);
            fetchCriteria();
        } catch (e) {
            alert('Error al guardar');
        }
    };

    const openModal = (item?: Criterion) => {
        setCurrentItem(item || { nombre: '', descripcion: '', peso: 20, orden: criteria.length + 1 });
        setIsEditing(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-gray-900 text-white shadow-lg p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-black text-brand-purple">CRITERIOS DE EVALUACIÓN</h1>
                    <Button onClick={() => router.back()} variant="ghost" className="text-white hover:text-brand-purple">
                        Volver
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 flex-grow">

                {/* Status Bar */}
                <div className={`mb-8 p-4 rounded-xl border flex justify-between items-center ${totalWeight === 100 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className="font-bold text-2xl">{totalWeight}%</div>
                        <div className="text-sm">
                            <span className="font-bold block">Peso Total Asignado</span>
                            {totalWeight !== 100 ? '⚠️ Debe sumar exactamente 100%' : '✅ Configuración correcta'}
                        </div>
                    </div>
                    <Button onClick={() => openModal()} size="sm" className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-100">
                        <Plus size={16} className="mr-2" />
                        Nuevo Criterio
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-20 animate-pulse">Cargando...</div>
                ) : (
                    <div className="grid gap-4">
                        {criteria.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-mono">#{item.orden}</span>
                                        <h3 className="font-bold text-lg text-gray-800">{item.nombre}</h3>
                                        <span className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full text-xs font-bold">{item.peso}%</span>
                                    </div>
                                    <p className="text-gray-500 text-sm">{item.descripcion || 'Sin descripción'}</p>
                                </div>
                                <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                                    <button onClick={() => openModal(item)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <Modal title={currentItem?.id ? "Editar Criterio" : "Nuevo Criterio"} isOpen={true} onClose={() => setIsEditing(false)}>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Criterio</label>
                            <Input
                                value={currentItem?.nombre}
                                onChange={e => setCurrentItem({ ...currentItem, nombre: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción (Instrucción para el Juez)</label>
                            <textarea
                                value={currentItem?.descripcion}
                                onChange={e => setCurrentItem({ ...currentItem, descripcion: e.target.value })}
                                className="w-full text-sm border-gray-300 rounded-lg p-3 border focus:ring-brand-purple focus:border-brand-purple text-gray-900 bg-white"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Peso (%)</label>
                                <Input
                                    type="number"
                                    value={currentItem?.peso}
                                    onChange={e => setCurrentItem({ ...currentItem, peso: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Orden</label>
                                <Input
                                    type="number"
                                    value={currentItem?.orden}
                                    onChange={e => setCurrentItem({ ...currentItem, orden: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button type="submit">Guardar</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
