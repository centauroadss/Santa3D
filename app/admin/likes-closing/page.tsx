'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
interface LikeClosingItem {
    id: string;
    dbId: string | null;
    thumbnailUrl: string;
    videoUrl: string | null;
    instagramUser: string;
    participantName: string;
    currentLikes: number;
    closingLikes: number;
    closingDate: string | null;
    instagramPermalink: string | null;
    status: string;
}
export default function LikesClosingPage() {
    const router = useRouter();
    const [items, setItems] = useState<LikeClosingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [closingDate, setClosingDate] = useState('');
    const [isSavingDate, setIsSavingDate] = useState(false);
    const [isSnapshotting, setIsSnapshotting] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        fetchData();
        fetchSettings();
    }, []);
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/likes-closing', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setItems(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/contest-settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.data.likes_closing_date) {
                // Format for input type="date"
                const date = new Date(res.data.data.likes_closing_date);
                setClosingDate(date.toISOString().split('T')[0]);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };
    const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setClosingDate(newDate);
        setIsSavingDate(true);
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post('/api/admin/contest-settings', {
                key: 'likes_closing_date',
                value: new Date(newDate).toISOString()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            alert('Error al guardar la fecha');
        } finally {
            setIsSavingDate(false);
        }
    };
    const handleSnapshot = async () => {
        if (!confirm('¿Estás seguro de ejecutar el CIERRE DE LIKES ahora? Esto congelará los likes actuales como "Likes Cierre".')) return;
        setIsSnapshotting(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post('/api/admin/likes-closing/snapshot', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert(res.data.message);
                fetchData();
            } else {
                alert('Error: ' + res.data.error);
            }
        } catch (error: any) {
            alert('Error de conexión: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSnapshotting(false);
        }
    };
    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('es-ES', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };
    if (isLoading) return <div className="p-10 text-center">Cargando...</div>;
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Likes Cierre 🔒</h1>
                        <p className="text-gray-500">Congela los likes de Instagram en una fecha específica.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                Fecha de Cierre Programada
                            </label>
                            <input
                                type="date"
                                value={closingDate}
                                onChange={handleDateChange}
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                            />
                            {isSavingDate && <span className="text-xs text-green-600 ml-2">Guardando...</span>}
                        </div>
                        <div className="h-8 w-px bg-gray-300 hidden md:block"></div>
                        <Button
                            onClick={handleSnapshot}
                            disabled={isSnapshotting}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-md w-full md:w-auto"
                        >
                            {isSnapshotting ? 'Ejecutando...' : '🚨 EJECUTAR CIERRE AHORA'}
                        </Button>
                    </div>
                </div>
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-center text-gray-500 font-semibold w-16">#</th>
                                    <th className="py-4 px-6 text-left text-gray-500 font-semibold">Participante</th>
                                    <th className="py-4 px-6 text-left text-gray-500 font-semibold">Video</th>
                                    <th className="py-4 px-6 text-center text-gray-500 font-semibold bg-gray-100/50">Fecha Cierre (Real)</th>
                                    <th className="py-4 px-6 text-center text-gray-900 font-bold bg-purple-50/50 border-l border-purple-100">🔒 Likes Cierre</th>
                                    <th className="py-4 px-6 text-center text-gray-400 font-medium">Likes Actuales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-gray-400">No hay datos disponibles.</td></tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 text-center text-gray-400 font-mono text-sm">
                                                {index + 1}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div>
                                                    <a href={`https://instagram.com/${item.instagramUser.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 hover:text-purple-600 hover:underline">{item.instagramUser}</a>
                                                    <div className="text-sm text-gray-500">{item.participantName}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden">
                                                    <img src={item.thumbnailUrl} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Video'; }} />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="text-sm font-mono text-gray-600">
                                                    {formatTime(item.closingDate)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center bg-purple-50/30 border-l border-purple-100">
                                                <div className="inline-flex items-center gap-1 font-black text-xl text-purple-700">
                                                    {item.closingDate ? item.closingLikes : '-'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center text-gray-400">
                                                {item.currentLikes}
                                            </td>
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
