'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import JudgesProfileTable from '@/components/judges/JudgesProfileTable';
import Button from '@/components/ui/Button';
export default function AdminJudgesPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [judges, setJudges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    useEffect(() => {
        // 1. Obtener token del almacenamiento de admin
        const storedToken = localStorage.getItem('admin_token');
        if (!storedToken) {
            console.warn('⚠️ No se encontró admin_token en localStorage. Se intentará cargar sin token.');
        }
        if (storedToken) {
             setToken(storedToken);
             fetchJudges(storedToken);
        } else {
             setIsLoading(false);
        }
    }, []);
    const fetchJudges = async (authToken: string) => {
        try {
            setIsLoading(true);
            setErrorMsg(null);
            // Hacemos la petición con el Bearer Token explícito
            const response = await axios.get('/api/judges', {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (response.data.success) {
                setJudges(response.data.data);
            }
        } catch (e: any) {
            console.error('Error fetching judges', e);
            const msg = e.response?.data?.error || e.message || 'Error desconocido';
            const roleDebug = e.response?.data?.received_role ? ` (Rol detectado: ${e.response?.data?.received_role})` : '';
            setErrorMsg('No se pudieron cargar los datos. ' + msg + roleDebug);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-gray-900 text-white shadow-lg p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-black text-brand-purple">ADMINISTRACIÓN DE JUECES</h1>
                    <Button onClick={() => router.push('/')} variant="ghost" className="text-white hover:text-brand-purple">
                        Volver al Inicio
                    </Button>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8 flex-grow">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Perfiles</h2>
                    <p className="text-gray-500">Administra la información pública del jurado.</p>
                </div>
                {errorMsg && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                        <p className="font-bold">Error de Acceso</p>
                        <p>{errorMsg}</p>
                        <p className="text-sm mt-2">Intenta recargar la página o volver a iniciar sesión.</p>
                    </div>
                )}
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4 animate-bounce">⏳</div>
                        <p className="text-gray-600 font-medium">Cargando datos...</p>
                    </div>
                ) : (
                    <>
                        {!errorMsg && token && (
                            <JudgesProfileTable
                                judges={judges}
                                token={token}
                                onRefresh={() => fetchJudges(token)}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
