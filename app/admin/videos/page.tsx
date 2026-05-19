'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, ChevronDown, ChevronUp, Play, FileVideo, UserCircle, Receipt, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface VideoData {
    id: string;
    fileName: string;
    url: string | null;
    categoria: string;
    status: string;
    uploadedAt: string;
    fileSize: number;
    format: string;
    resolution: string;
    fps: number | string;
    duration: number | string;
    warnings: any[];
}

interface InscripcionData {
    id: string;
    participantName: string;
    cedulaIdentidad: string;
    fechaNacimiento: string | null;
    edad: number | null;
    instagram: string;
    email: string;
    telefono: string;
    categoria: string;
    estatusInscripcion: string;
    createdAt: string;
    fotoPerfilUrl: string | null;
    comprobanteUrl: string | null;
    ocrData: any;
    referencia: string;
    bancoOrigen: string;
    montoBs: string | number;
    concepto: string;
    ocrReferenciaDetectada: string | null;
    ocrBancoEmisorCodigo: string | null;
    ocrMontoDetectadoBs: number | null;
    ocrConceptoExtraido: string | null;
    ocrFechaExtraida: string | null;
    ocrConformidadGeneral: boolean;
    estatusPago: string;
    videos: VideoData[];
}

type SortField = 'createdAt' | 'participantName' | 'categoria';
type SortOrder = 'asc' | 'desc';

export default function AdminInscripcionesPage() {
    const [inscripciones, setInscripciones] = useState<InscripcionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
    
    // Sorting
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    
    // Playing
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [playingImage, setPlayingImage] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Editing State
    const [editingInscripcion, setEditingInscripcion] = useState<InscripcionData | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchInscripciones();
    }, []);

    const fetchInscripciones = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/videos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setInscripciones(res.data.data);
            } else {
                setError(res.data.error || 'Error desconocido al cargar inscripciones');
            }
        } catch (error: any) {
            console.error('Error fetching inscripciones:', error);
            setError(error.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta inscripción y todos sus datos asociados de la base de datos?')) {
            return;
        }

        setIsDeleting(id);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.delete(`/api/admin/inscripciones/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setInscripciones(prev => prev.filter(i => i.id !== id));
            } else {
                alert(res.data.error || 'Error al eliminar');
            }
        } catch (error: any) {
            console.error('Error deleting:', error);
            alert('Error de conexión al eliminar');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleEdit = (id: string) => {
        const insc = inscripciones.find(i => i.id === id);
        if (insc) {
            setEditingInscripcion(insc);
            setEditFormData({
                nombre: insc.participantName.split(' ')[0] || '',
                apellido: insc.participantName.split(' ').slice(1).join(' ') || '',
                cedulaIdentidad: insc.cedulaIdentidad || '',
                email: insc.email || '',
                telefono: insc.telefono || '',
                instagram: insc.instagram || '',
                categoria: insc.categoria || 'RENDER',
                estatusInscripcion: insc.estatusInscripcion || 'PENDIENTE',
                pago: {
                    bancoOrigenCodigo: insc.bancoOrigen || '',
                    referencia: insc.referencia || '',
                    montoCapturadoBs: insc.montoBs || '',
                    concepto: insc.concepto || '',
                    estatusPago: insc.estatusPago || 'EN_REVISION',
                    ocrBancoEmisorCodigo: insc.ocrBancoEmisorCodigo || '',
                    ocrReferenciaDetectada: insc.ocrReferenciaDetectada || '',
                    ocrMontoDetectadoBs: insc.ocrMontoDetectadoBs?.toString() || '',
                    ocrConceptoExtraido: insc.ocrConceptoExtraido || '',
                    ocrFechaExtraida: insc.ocrFechaExtraida ? new Date(insc.ocrFechaExtraida).toISOString().slice(0, 16) : ''
                }
            });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingInscripcion) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.put(`/api/admin/inscripciones/${editingInscripcion.id}`, editFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert('Inscripción actualizada correctamente');
                setEditingInscripcion(null);
                fetchInscripciones(); // Recargar datos
            } else {
                alert('Error al guardar: ' + res.data.error);
            }
        } catch (error: any) {
            console.error('Error saving:', error);
            alert('Error de conexión al guardar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const safeFormatDate = (dateStr: string) => {
        try {
            if (!dateStr) return '-';
            return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
        } catch (e) {
            return dateStr || '-';
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc'); // Default to asc for new field
        }
    };

    const formatDuration = (seconds: number | string) => {
        const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
        if (isNaN(num) || num === 0) return '-';
        const mins = Math.floor(num / 60);
        const secs = Math.floor(num % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const processedInscripciones = useMemo(() => {
        let result = [...inscripciones];
        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(i =>
                i.participantName.toLowerCase().includes(lowerTerm) ||
                i.email.toLowerCase().includes(lowerTerm) ||
                (i.telefono && i.telefono.includes(lowerTerm))
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(i => i.estatusInscripcion === statusFilter);
        }
        if (categoriaFilter !== 'all') {
            result = result.filter(i => i.categoria === categoriaFilter);
        }

        // 2. Sort
        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [inscripciones, searchTerm, statusFilter, categoriaFilter, sortField, sortOrder]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block opacity-0 group-hover:opacity-30 self-center"><ChevronDown size={14} /></div>;
        return <div className="w-4 h-4 ml-1 inline-block text-brand-purple self-center">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>;
    };
    
    const handleImageModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setPlayingImage(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Inscripciones 📝</h1>
                    <p className="text-gray-500 text-sm">Validación de registros, pagos y obras técnicas</p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto items-end">
                    <button 
                        onClick={async () => {
                            if (window.confirm('🚨 PELIGRO: ¿Estás seguro de que quieres BORRAR TODAS LAS INSCRIPCIONES, PAGOS Y VIDEOS de la base de datos? Esto es solo para pruebas.')) {
                                try {
                                    const token = localStorage.getItem('admin_token');
                                    const res = await axios.post('/api/admin/clean-db', {}, { headers: { Authorization: `Bearer ${token}` } });
                                    if (res.data.success) {
                                        alert('Base de datos limpiada correctamente. La página se recargará.');
                                        window.location.reload();
                                    } else {
                                        alert('Error al limpiar DB: ' + res.data.error);
                                    }
                                } catch (e) {
                                    alert('Error de conexión al limpiar DB.');
                                }
                            }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 text-xs rounded-lg transition-colors"
                    >
                        🗑️ Limpiar BD (Pruebas)
                    </button>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-grow md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Buscar por nombre, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 text-sm"
                            />
                        </div>
                        <select
                            className="bg-white border boundary-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple text-gray-900"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Estatus Inscripción</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="COMPLETADO">Completado</option>
                            <option value="RECHAZADO">Rechazado</option>
                        </select>
                        <select
                            className="bg-white border boundary-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple text-gray-900"
                            value={categoriaFilter}
                            onChange={(e) => setCategoriaFilter(e.target.value)}
                        >
                            <option value="all">Todas Categorías</option>
                            <option value="RENDER">Render 3D</option>
                            <option value="IA">Inteligencia Artificial</option>
                            <option value="AMBAS">Ambas</option>
                        </select>
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden border border-gray-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 cursor-pointer group hover:bg-gray-100 transition-colors w-24" onClick={() => handleSort('createdAt')}>
                                    <div className="flex">Fecha <SortIcon field="createdAt" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('participantName')}>
                                    <div className="flex">Participante <SortIcon field="participantName" /></div>
                                </th>
                                <th className="px-4 py-3 text-center w-24">Medios</th>
                                <th className="px-4 py-3 min-w-[300px]">Obras (Videos)</th>
                                <th className="px-4 py-3 text-center w-28">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {processedInscripciones.map((insc) => (
                                <tr key={insc.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs align-top pt-4">
                                        {safeFormatDate(insc.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 align-top pt-4">
                                        <div className="flex gap-3">
                                            {insc.fotoPerfilUrl ? (
                                                <img 
                                                    src={insc.fotoPerfilUrl} 
                                                    alt={insc.participantName} 
                                                    className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0 cursor-pointer border border-gray-200"
                                                    onClick={() => setPlayingImage(insc.fotoPerfilUrl!)}
                                                    title="Ver Foto de Perfil"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400">
                                                    <UserCircle size={24} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-gray-900 leading-tight flex items-center gap-2">
                                                    {insc.participantName}
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider ${insc.categoria === 'RENDER' ? 'bg-red-100 text-red-700' : insc.categoria === 'IA' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {insc.categoria}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono mt-1">C.I: {insc.cedulaIdentidad}</div>
                                                {insc.fechaNacimiento && (
                                                    <div className="text-[10px] text-gray-500 font-mono">Nac: {insc.fechaNacimiento.split('T')[0].split('-').reverse().join('/')} ({insc.edad} años)</div>
                                                )}
                                                <div className="text-[10px] text-brand-purple font-mono font-bold">{insc.instagram}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-1">{insc.email}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{insc.telefono}</div>
                                                <div className="mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${insc.estatusInscripcion === 'COMPLETADO' ? 'bg-green-100 text-green-700' :
                                                        insc.estatusInscripcion === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {insc.estatusInscripcion}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center align-top pt-4">
                                        <div className="flex gap-2 justify-center mb-2">
                                            {insc.comprobanteUrl ? (
                                                <button
                                                    onClick={() => setPlayingImage(insc.comprobanteUrl!)}
                                                    className="w-full bg-black/5 hover:bg-green-600 hover:text-white text-green-600 rounded flex items-center justify-center transition-all group py-1 text-xs font-bold"
                                                    title="Ver Comprobante de Pago"
                                                >
                                                    <Receipt size={14} className="mr-1" /> Ver Comprobante
                                                </button>
                                            ) : (
                                                <div className="w-full bg-gray-100 py-1 flex items-center justify-center text-gray-400 rounded text-xs" title="Sin pago"><Receipt size={14} className="mr-1"/> Sin Pago</div>
                                            )}
                                        </div>
                                        <div className="mt-2 text-[10px] bg-gray-50 p-2 rounded border border-gray-100 text-left w-full max-w-[180px] mx-auto">
                                            <div className="font-bold text-gray-700 mb-1 border-b border-gray-200 pb-1">Datos de Captura</div>
                                            <div className="text-gray-600 font-mono leading-tight mt-1 truncate" title={insc.ocrReferenciaDetectada || insc.referencia}>
                                                <span className="font-bold text-gray-400 mr-1">Ref:</span>{typeof insc.ocrReferenciaDetectada === 'string' && insc.ocrReferenciaDetectada.trim().length > 0 ? insc.ocrReferenciaDetectada : 'N/D'}
                                            </div>
                                            <div className="text-gray-600 font-mono leading-tight mt-1 truncate" title={insc.ocrBancoEmisorCodigo || insc.bancoOrigen}>
                                                <span className="font-bold text-gray-400 mr-1">Banco:</span>{typeof insc.ocrBancoEmisorCodigo === 'string' && insc.ocrBancoEmisorCodigo.trim().length > 0 ? insc.ocrBancoEmisorCodigo : 'N/D'}
                                            </div>
                                            <div className="text-gray-600 font-mono leading-tight mt-1 truncate" title={typeof insc.ocrMontoDetectadoBs === 'number' ? `Bs ${insc.ocrMontoDetectadoBs.toFixed(2)}` : 'N/D'}>
                                                <span className="font-bold text-gray-400 mr-1">Monto:</span>{typeof insc.ocrMontoDetectadoBs === 'number' ? `Bs ${insc.ocrMontoDetectadoBs.toFixed(2)}` : 'N/D'}
                                            </div>
                                            <div className="text-gray-600 font-mono leading-tight mt-1 truncate" title={insc.ocrConceptoExtraido || insc.concepto || 'N/D'}>
                                                <span className="font-bold text-gray-400 mr-1">Conc:</span>{typeof insc.ocrConceptoExtraido === 'string' && insc.ocrConceptoExtraido.trim().length > 0 ? insc.ocrConceptoExtraido : 'N/D'}
                                            </div>
                                            <div className="text-gray-600 font-mono leading-tight mt-1 truncate" title={insc.ocrFechaExtraida ? new Date(insc.ocrFechaExtraida).toLocaleDateString() : 'N/D'}>
                                                <span className="font-bold text-gray-400 mr-1">Fecha:</span>{insc.ocrFechaExtraida ? insc.ocrFechaExtraida.split('T')[0].split('-').reverse().join('/') : 'N/D'}
                                            </div>
                                            {insc.ocrConformidadGeneral ? (
                                                <div className="mt-2 text-green-700 font-bold bg-green-100 p-1 rounded text-center" title="Conformidad General">
                                                    ✅ Conformidad
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-red-600 font-bold bg-red-100 p-1 rounded text-center" title="Banco, Cédula o Teléfono del receptor no coinciden con la Configuración Global">
                                                    ⚠️ No Conformidad
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        {insc.videos.length === 0 ? (
                                            <span className="text-gray-400 text-xs italic mt-2 inline-block">Sin videos cargados</span>
                                        ) : (
                                            <div className="space-y-3">
                                                {insc.videos.map(video => {
                                                    const isResOk = video.resolution === '1024x2048';
                                                    const fpsVal = typeof video.fps === 'string' ? parseFloat(video.fps) : video.fps;
                                                    const isFpsOk = fpsVal && fpsVal >= 25;
                                                    const durVal = typeof video.duration === 'string' ? parseFloat(video.duration) : video.duration;
                                                    const isDurOk = durVal && Math.round(durVal) === 30;
                                                    const isFormatOk = video.format && video.format.toLowerCase().includes('mp4');
                                                    
                                                    const okClass = 'text-green-600 bg-green-50 border-green-200';
                                                    const warnClass = 'text-red-600 bg-red-50 border-red-200';

                                                    return (
                                                        <div key={video.id} className="border border-gray-100 rounded-lg p-2 bg-white text-xs">
                                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                                                                <button
                                                                    onClick={() => setPlayingVideo(video.url)}
                                                                    disabled={!video.url}
                                                                    className={`w-6 h-6 flex items-center justify-center rounded-full ${video.url ? 'bg-brand-purple text-white hover:bg-brand-purple/80' : 'bg-gray-100 text-gray-400'}`}
                                                                >
                                                                    <Play size={10} className="ml-0.5" />
                                                                </button>
                                                                <span className="font-bold text-gray-700">{video.categoria}</span>
                                                                <span className="text-gray-400 font-mono ml-auto">Subido: {safeFormatDate(video.uploadedAt)}</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2 font-mono">
                                                                <div className={`px-2 py-1 border rounded text-center ${isResOk ? okClass : warnClass}`}>
                                                                    <div className="text-[8px] uppercase text-gray-500 mb-0.5 leading-none">Res</div>
                                                                    {video.resolution || 'N/A'}
                                                                </div>
                                                                <div className={`px-2 py-1 border rounded text-center ${isFpsOk ? okClass : warnClass}`}>
                                                                    <div className="text-[8px] uppercase text-gray-500 mb-0.5 leading-none">FPS</div>
                                                                    {video.fps || 'N/A'}
                                                                </div>
                                                                <div className={`px-2 py-1 border rounded text-center ${isDurOk ? okClass : warnClass}`}>
                                                                    <div className="text-[8px] uppercase text-gray-500 mb-0.5 leading-none">Dur</div>
                                                                    {formatDuration(video.duration)}
                                                                </div>
                                                                <div className={`px-2 py-1 border rounded text-center ${isFormatOk ? okClass : warnClass}`}>
                                                                    <div className="text-[8px] uppercase text-gray-500 mb-0.5 leading-none">Formato</div>
                                                                    {video.format || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center align-top pt-4">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleEdit(insc.id)}
                                                className="w-8 h-8 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded flex items-center justify-center transition-all"
                                                title="Editar Inscripción"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(insc.id)}
                                                disabled={isDeleting === insc.id}
                                                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${isDeleting === insc.id ? 'bg-gray-100 text-gray-400' : 'bg-red-50 hover:bg-red-600 hover:text-white text-red-600'}`}
                                                title="Eliminar Inscripción"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {processedInscripciones.length === 0 && !loading && !error && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        No se encontraron inscripciones
                                    </td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-red-500 font-bold bg-red-50">
                                        ERROR: {error}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Admin Video Modal - 9:16 Vertical Style */}
            {playingVideo && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <button
                        onClick={() => setPlayingVideo(null)}
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[120]"
                    >
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative w-full max-w-[50vh] aspect-[9/16] bg-black overflow-hidden rounded-[2rem] shadow-2xl border-4 border-white/10 flex flex-col items-center">
                        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none">
                            <h3 className="text-white font-bold text-lg drop-shadow-md">Vista Previa</h3>
                        </div>
                        <div className="relative w-full h-full bg-black z-10 flex items-center justify-center">
                            <video
                                src={playingVideo}
                                className="w-full h-full object-cover"
                                autoPlay
                                controls
                                controlsList="nodownload"
                                disablePictureInPicture
                                onError={(e) => console.error("Video Error:", e)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Media Image Modal */}
            {playingImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-pointer"
                    onClick={handleImageModalClick}
                >
                    <button
                        onClick={() => setPlayingImage(null)}
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[120]"
                    >
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center bg-transparent cursor-default rounded-xl overflow-hidden shadow-2xl">
                        <img 
                            src={playingImage} 
                            alt="Media Preview" 
                            className="max-w-full max-h-[90vh] object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}

            {/* Modal de Edición */}
            {editingInscripcion && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative my-8">
                        <button 
                            onClick={() => setEditingInscripcion(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Editar Inscripción</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Columna Izquierda: Datos Participante */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-brand-purple">Datos del Participante</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Nombre</label>
                                        <Input 
                                            value={editFormData.nombre} 
                                            onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Apellido</label>
                                        <Input 
                                            value={editFormData.apellido} 
                                            onChange={(e) => setEditFormData({...editFormData, apellido: e.target.value})}
                                            className="w-full text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Cédula Identidad</label>
                                    <Input 
                                        value={editFormData.cedulaIdentidad} 
                                        onChange={(e) => setEditFormData({...editFormData, cedulaIdentidad: e.target.value})}
                                        className="w-full text-sm font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Teléfono</label>
                                        <Input 
                                            value={editFormData.telefono} 
                                            onChange={(e) => setEditFormData({...editFormData, telefono: e.target.value})}
                                            className="w-full text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Instagram</label>
                                        <Input 
                                            value={editFormData.instagram} 
                                            onChange={(e) => setEditFormData({...editFormData, instagram: e.target.value})}
                                            className="w-full text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                                    <Input 
                                        value={editFormData.email} 
                                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                        className="w-full text-sm font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
                                        <select 
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                                            value={editFormData.categoria}
                                            onChange={(e) => setEditFormData({...editFormData, categoria: e.target.value})}
                                        >
                                            <option value="RENDER">RENDER</option>
                                            <option value="IA">IA</option>
                                            <option value="AMBAS">AMBAS</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Estatus General</label>
                                        <select 
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                                            value={editFormData.estatusInscripcion}
                                            onChange={(e) => setEditFormData({...editFormData, estatusInscripcion: e.target.value})}
                                        >
                                            <option value="PENDIENTE">PENDIENTE</option>
                                            <option value="COMPLETADO">COMPLETADO</option>
                                            <option value="RECHAZADO">RECHAZADO</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Columna Derecha: Datos Pago */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-brand-purple">Datos de Pago Declarados</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Cód. Banco</label>
                                        <Input 
                                            value={editFormData.pago?.bancoOrigenCodigo} 
                                            onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, bancoOrigenCodigo: e.target.value}})}
                                            className="w-full text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Referencia</label>
                                        <Input 
                                            value={editFormData.pago?.referencia} 
                                            onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, referencia: e.target.value}})}
                                            className="w-full text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Monto Bs</label>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        value={editFormData.pago?.montoCapturadoBs} 
                                        onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, montoCapturadoBs: e.target.value}})}
                                        className="w-full text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Concepto</label>
                                    <textarea 
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-purple focus:border-brand-purple font-mono"
                                        rows={3}
                                        value={editFormData.pago?.concepto} 
                                        onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, concepto: e.target.value}})}
                                    />
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Estatus del Pago</label>
                                    <select 
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm font-bold text-blue-700 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                                        value={editFormData.pago?.estatusPago}
                                        onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, estatusPago: e.target.value}})}
                                    >
                                        <option value="EN_REVISION">EN_REVISION</option>
                                        <option value="VALIDADO">VALIDADO</option>
                                        <option value="RECHAZADO">RECHAZADO</option>
                                    </select>
                                </div>
                                
                                <h3 className="text-lg font-bold text-orange-600 mt-6 pt-4 border-t border-gray-200">Datos Extraídos por OCR</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">OCR Banco Emisor</label>
                                        <Input 
                                            value={editFormData.pago?.ocrBancoEmisorCodigo} 
                                            onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, ocrBancoEmisorCodigo: e.target.value}})}
                                            className="w-full text-sm font-mono border-orange-200 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">OCR Referencia</label>
                                        <Input 
                                            value={editFormData.pago?.ocrReferenciaDetectada} 
                                            onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, ocrReferenciaDetectada: e.target.value}})}
                                            className="w-full text-sm font-mono border-orange-200 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">OCR Monto Bs</label>
                                        <Input 
                                            type="number"
                                            step="0.01"
                                            value={editFormData.pago?.ocrMontoDetectadoBs} 
                                            onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, ocrMontoDetectadoBs: e.target.value}})}
                                            className="w-full text-sm font-mono border-orange-200 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">OCR Fecha</label>
                                        <Input 
                                            type="datetime-local"
                                            value={editFormData.pago?.ocrFechaExtraida} 
                                            onChange={(e) => setEditFormData({...editFormData, pago: {...editFormData.pago, ocrFechaExtraida: e.target.value}})}
                                            className="w-full text-sm font-mono border-orange-200 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end gap-3">
                            <button 
                                onClick={() => setEditingInscripcion(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-6 py-2 bg-brand-purple text-white rounded-lg text-sm font-bold hover:bg-brand-purple/90 transition-colors flex items-center"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
