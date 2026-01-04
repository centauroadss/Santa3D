'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
interface MediaItem {
    rank: number;
    id: string; // Instagram ID
    dbId: string | null; // Database ID if linked
    thumbnailUrl: string;
    videoUrl: string | null;
    instagramUser: string;
    participantName: string;
    uploadedAt: string;
    likes: number;
    instagramPermalink: string | null;
    status: 'PENDING_UPLOAD' | 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'UNLINKED' | 'LINKED_NO_VIDEO';
    isUserFound: boolean;
    hasDbVideo: boolean;
    isJudgeSelected?: boolean;
}
export default function InstagramCurationPage() {
    const router = useRouter();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'pending' | 'validated'>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorLog, setErrorLog] = useState<string | null>(null);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    useEffect(() => {
        fetchData();
    }, [filter]);
    // ... fetchData, toggleSelection, toggleSelectAll, handleBulkApprove ...
    const fetchData = async () => {
        setIsLoading(true);
        setErrorLog(null);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }
            const response = await axios.get(`/api/admin/instagram/media?filter=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setMediaItems(response.data.data);
                setSelectedIds(new Set());
                // Show debug warning if provided and list is empty
                if (response.data.data.length === 0 && response.data.debugInfo?.error) {
                    setErrorLog(`INSTAGRAM ERROR: ${response.data.debugInfo.error}\n\nCheck your .env keys.`);
                }
            }
        } catch (error: any) {
            console.error('Error fetching media (DETAILS):', error.response?.data || error);
            const serverMsg = error.response?.data?.error || error.message;
            const serverStack = error.response?.data?.stack || '';
            setErrorLog(`SERVER ERROR: ${serverMsg}\n\nSTACK:\n${serverStack}`);
        } finally {
            setIsLoading(false);
        }
    };
    const toggleSelection = (id: string | null) => {
        if (!id) return; // Cannot select items without DB ID
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };
    const toggleSelectAll = () => {
        // Only select items that have a dbId
        const validItems = mediaItems.filter(m => m.dbId).map(m => m.dbId!);
        if (selectedIds.size === validItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(validItems));
        }
    };
    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`¿Estás seguro de aprobar ${selectedIds.size} videos para los jueces?`)) return;
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.post('/api/admin/videos/validate', {
                videoIds: Array.from(selectedIds),
                action: 'approve'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                alert(response.data.message);
                fetchData(); // Refresh list
            } else {
                alert('Error: ' + response.data.error);
            }
        } catch (error: any) {
            alert('Error de conexión.');
        } finally {
            setIsProcessing(false);
        }
    };
    const handleToggleJudgeSelection = async (dbId: string | null, isSelected: boolean) => {
        if (!dbId) return;
        // Optimistic Update
        setMediaItems(prev => prev.map(item =>
            item.dbId === dbId ? { ...item, isJudgeSelected: isSelected } : item
        ));
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post('/api/admin/instagram/toggle-judge', {
                videoId: dbId,
                isSelected
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Success - No action needed (Optimistic update holds)
        } catch (error: any) {
            console.error('Toggle failed:', error);
            alert('Error al actualizar selección: ' + (error.response?.data?.error || error.message));
            // Revert on error
            setMediaItems(prev => prev.map(item =>
                item.dbId === dbId ? { ...item, isJudgeSelected: !isSelected } : item
            ));
            fetchData(); // Sync with server for safety
        }
    };
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VALIDATED':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">APROBADO</span>;
            case 'PENDING_VALIDATION':
            case 'PENDING_UPLOAD':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">PENDIENTE</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">RECHAZADO</span>;
            case 'UNLINKED':
                return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">NO ENLAZADO</span>;
            case 'LINKED_NO_VIDEO':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">SIN VIDEO</span>;
            default:
                return null;
        }
    };
    if (errorLog) {
        return (
            <div className="min-h-screen p-10 bg-red-50">
                <h1 className="text-2xl font-bold text-red-700 mb-4">Error de Depuración</h1>
                <div className="bg-white p-6 rounded shadow border border-red-200">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-xs whitespace-pre-wrap">
                        {errorLog}
                    </pre>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }
    if (isLoading) {
        return <div className="p-10 text-center">Cargando Instagram...</div>;
    }
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Curaduría Instagram 📸</h1>
                        <p className="text-gray-500">Muestra contenido EN VIVO de Instagram. Solo los videos enlazados pueden aprobarse.</p>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <Button variant={filter === 'all' ? 'primary' : 'outline'} onClick={() => setFilter('all')} className="text-sm">Todos</Button>
                        <Button variant={filter === 'pending' ? 'primary' : 'outline'} onClick={() => setFilter('pending')} className="text-sm">Pendientes</Button>
                        <Button variant={filter === 'validated' ? 'primary' : 'outline'} onClick={() => setFilter('validated')} className="text-sm">Aprobados</Button>
                    </div>
                </div>
                <Card className="overflow-hidden">
                    {/* Stats Header */}
                    <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{mediaItems.length}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Live</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {mediaItems.filter(i => i.isJudgeSelected).length}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Seleccionados para Jueces</div>
                            </div>
                        </div>
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="bg-purple-100 p-4 flex justify-between items-center border-b border-purple-200 animate-in fade-in slide-in-from-top-2">
                            <span className="font-bold text-purple-900">{selectedIds.size} videos seleccionados (Acción Masiva)</span>
                            <Button onClick={handleBulkApprove} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700 text-white">
                                {isProcessing ? 'Procesando...' : '✅ APROBAR PARA JUECES'}
                            </Button>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-center text-gray-500 font-semibold w-16">#</th>
                                    <th className="py-4 px-6 text-left text-gray-500 font-semibold">Participante</th>
                                    <th className="py-4 px-6 text-left text-gray-500 font-semibold">Video</th>
                                    <th className="py-4 px-6 text-left text-gray-500 font-semibold">Validaciones</th>
                                    <th className="py-4 px-6 text-center text-gray-500 font-semibold cursor-help" title="Contador Live">❤️ Likes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {mediaItems.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-gray-400">No se encontraron videos en Instagram.</td></tr>
                                ) : (
                                    mediaItems.map((item) => {
                                        const isSelectable = !!item.dbId;
                                        return (
                                            <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(item.dbId || '') ? 'bg-purple-50' : ''} ${!isSelectable ? 'opacity-60 bg-gray-50' : ''}`} onClick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON' && isSelectable) toggleSelection(item.dbId); }}>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${item.rank === 1 ? 'bg-yellow-100 text-yellow-700' : item.rank === 2 ? 'bg-gray-100 text-gray-700' : item.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'}`}>{item.rank}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <a href={`https://instagram.com/${item.instagramUser.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 hover:text-purple-600 hover:underline">{item.instagramUser}</a>
                                                        <div className="text-sm text-gray-500">{item.participantName}</div>
                                                        <div className="text-xs text-gray-400 mt-1">{new Date(item.uploadedAt).toLocaleDateString()}</div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (item.videoUrl) setPlayingVideo(item.videoUrl);
                                                            else window.open(item.instagramPermalink || '', '_blank');
                                                        }}
                                                        className="block w-24 h-16 bg-gray-200 rounded overflow-hidden relative hover:opacity-80 transition-opacity group"
                                                    >
                                                        <img src={item.thumbnailUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Video'; }} />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                                            <span className="text-white text-xl">▶️</span>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {getStatusBadge(item.status)}
                                                    {item.isUserFound && item.hasDbVideo && item.status !== 'VALIDATED' && (
                                                        <div className="text-xs text-red-500 mt-1">Requiere Valid. Manual</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="inline-flex items-center gap-1 font-bold text-lg text-pink-600"><span>{item.likes}</span><span className="text-xl">❤️</span></div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
                {/* Video Modal */}
                {playingVideo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPlayingVideo(null)}>
                        <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setPlayingVideo(null)}
                                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
                            >
                                ✕ Cerrar
                            </button>
                            <video
                                src={playingVideo}
                                controls
                                autoPlay
                                className="w-full max-h-[80vh] object-contain"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
