'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, ChevronDown, ChevronUp, Play, FileVideo } from 'lucide-react';
import { format } from 'date-fns';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
interface VideoData {
    id: string;
    participantName: string;
    email: string;
    telefono: string;
    categoria: string;
    categoriaInscripcion: string;
    fileName: string;
    url: string | null;
    comprobanteUrl: string | null;
    status: string;
    uploadedAt: string;
    fileSize: number;
    format: string;
    resolution: string;
    fps: number | string;
    duration: number | string;
    warnings: any[];
}
type SortField = 'uploadedAt' | 'fileSize' | 'participantName' | 'status' | 'duration' | 'age';
type SortOrder = 'asc' | 'desc';
export default function AdminVideosPage() {
    const [videos, setVideos] = useState<VideoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
    // Sorting
    const [sortField, setSortField] = useState<SortField>('uploadedAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    // Playing
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [playingImage, setPlayingImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        fetchVideos();
    }, []);
    const fetchVideos = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/videos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setVideos(res.data.data);
            } else {
                setError(res.data.error || 'Error desconocido al cargar videos');
            }
        } catch (error: any) {
            console.error('Error fetching videos:', error);
            setError(error.message || 'Error de conexión');
        } finally {
            setLoading(false);
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
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const formatDuration = (seconds: number | string) => {
        const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
        if (isNaN(num) || num === 0) return '-';
        const mins = Math.floor(num / 60);
        const secs = Math.floor(num % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const processedVideos = useMemo(() => {
        let result = [...videos];
        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(v =>
                v.participantName.toLowerCase().includes(lowerTerm) ||
                v.email.toLowerCase().includes(lowerTerm) ||
                (v.telefono && v.telefono.includes(lowerTerm))
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(v => v.status === statusFilter);
        }
        if (categoriaFilter !== 'all') {
            result = result.filter(v => v.categoria === categoriaFilter);
        }
        // 2. Sort
        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            // Handle undefined/null (push to bottom)
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            // Handle potential strings in numeric fields for safety
            if (sortField === 'duration') {
                valA = typeof valA === 'string' ? parseFloat(valA) : valA;
                valB = typeof valB === 'string' ? parseFloat(valB) : valB;
            }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [videos, searchTerm, statusFilter, sortField, sortOrder]);
    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <div className="w-4 h-4 ml-1 inline-block opacity-0 group-hover:opacity-30 self-center"><ChevronDown size={14} /></div>;
        return <div className="w-4 h-4 ml-1 inline-block text-brand-purple self-center">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>;
    };
    
    // Función para manejar clicks fuera del modal de imagen
    const handleImageModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setPlayingImage(null);
        }
    };
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Videos 🎬</h1>
                    <p className="text-gray-500 text-sm">Metadatos técnicos y visualización rápida</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Buscar por nombre, email, IG..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-sm"
                        />
                    </div>
                    <select
                        className="bg-white border boundary-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="RECIBIDO">Recibido</option>
                        <option value="APROBADO">Aprobado</option>
                        <option value="RECHAZADO">Rechazado</option>
                    </select>
                    <select
                        className="bg-white border boundary-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        value={categoriaFilter}
                        onChange={(e) => setCategoriaFilter(e.target.value)}
                    >
                        <option value="all">Categorías</option>
                        <option value="RENDER">Render 3D</option>
                        <option value="IA">Inteligencia Artificial</option>
                    </select>
                </div>
            </div>
            <Card className="overflow-hidden border border-gray-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('uploadedAt')}>
                                    <div className="flex">Fecha <SortIcon field="uploadedAt" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('participantName')}>
                                    <div className="flex">Participante <SortIcon field="participantName" /></div>
                                </th>
                                <th className="px-4 py-3 text-center">Datos</th>
                                <th className="px-4 py-3 text-center">Categoría</th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex flex-col">
                                        <span>RES</span>
                                        <span className="text-[10px] text-gray-400 font-normal">1024x2048</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex flex-col">
                                        <span>FPS</span>
                                        <span className="text-[10px] text-gray-400 font-normal">30</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('duration')}>
                                    <div className="flex flex-col items-center">
                                        <div className="flex justify-center">Duración <SortIcon field="duration" /></div>
                                        <span className="text-[10px] text-gray-400 font-normal">30 seg</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('fileSize')}>
                                    <div className="flex justify-end">Tamaño <SortIcon field="fileSize" /></div>
                                </th>
                                <th className="px-4 py-3 text-center cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex justify-center">Estado <SortIcon field="status" /></div>
                                </th>
                                <th className="px-4 py-3 text-center w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {processedVideos.map((video) => {
                                const isResOk = video.resolution === '1024x2048';
                                const fpsVal = typeof video.fps === 'string' ? parseFloat(video.fps) : video.fps;
                                const isFpsOk = fpsVal && fpsVal >= 25; // Asumimos 25-30 como OK
                                const durVal = typeof video.duration === 'string' ? parseFloat(video.duration) : video.duration;
                                const isDurOk = durVal && durVal === 30; // 30s es la regla
                                const okClass = 'text-green-600 font-bold';
                                const warnClass = 'text-yellow-600 font-bold';
                                
                                return (
                                    <tr key={video.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                            {safeFormatDate(video.uploadedAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-gray-900 leading-tight">{video.participantName}</div>
                                            <div className="text-[10px] text-gray-400 font-mono mt-1">{video.email}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{video.telefono}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 text-center">
                                            {video.categoriaInscripcion === 'AMBAS' && (
                                                <div className="text-[10px] font-bold text-purple-600 mb-1 border border-purple-200 bg-purple-50 rounded px-1 inline-block">INSCRITO: AMBAS</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${video.categoria === 'RENDER' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {video.categoria}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-center font-mono text-xs ${isResOk ? okClass : warnClass}`}>
                                            {video.resolution || '-'}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-mono text-xs ${isFpsOk ? okClass : warnClass}`}>
                                            {video.fps ? video.fps : '-'}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-mono text-xs ${isDurOk ? okClass : warnClass}`}>
                                            {formatDuration(video.duration)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs text-brand-purple font-medium whitespace-nowrap">
                                            {formatBytes(video.fileSize)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${video.status === 'APROBADO' ? 'bg-green-100 text-green-700' :
                                                video.status === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {(video.status || 'RECIBIDO').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                {video.comprobanteUrl ? (
                                                    <button
                                                        onClick={() => setPlayingImage(video.comprobanteUrl)}
                                                        className="w-8 h-8 bg-black/5 hover:bg-green-600 hover:text-white text-green-600 rounded flex items-center justify-center transition-all group"
                                                        title="Ver Comprobante de Pago"
                                                    >
                                                        <span className="text-[10px] font-bold">$</span>
                                                    </button>
                                                ) : (
                                                    <div className="w-8 h-8 flex items-center justify-center text-gray-300" title="Sin pago"><span className="text-[10px]">$</span></div>
                                                )}

                                                {video.url ? (
                                                    <button
                                                        onClick={() => setPlayingVideo(video.url)}
                                                        className="w-8 h-8 bg-black/5 hover:bg-brand-purple hover:text-white rounded flex items-center justify-center transition-all group"
                                                        title="Reproducir Video"
                                                    >
                                                        <Play size={14} className="ml-0.5" />
                                                    </button>
                                                ) : (
                                                    <div className="w-8 h-8 flex justify-center items-center text-gray-300"><FileVideo size={16} /></div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {processedVideos.length === 0 && !loading && !error && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        No se encontraron videos
                                    </td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-red-500 font-bold bg-red-50">
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
                        {/* Header Info Overlay */}
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
            {/* Admin Receipt Image Modal */}
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
                            alt="Comprobante de Pago" 
                            className="max-w-full max-h-[90vh] object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
