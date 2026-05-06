'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VideoUploader from '@/components/copa2026/VideoUploader';
import Image from 'next/image';

export default function UploadVideoPage({ params }: { params: { token: string } }) {
    const router = useRouter();
    const token = params.token;
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'pending' | 'loaded' | 'expired' | 'invalid'>('pending');
    const [participante, setParticipante] = useState<any>(null);
    const [videos, setVideos] = useState<any[]>([]);
    
    // Status para el proceso de confirmación
    const [confirming, setConfirming] = useState(false);
    const [confirmSuccess, setConfirmSuccess] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    useEffect(() => {
        if (!token) return;

        const verifyToken = async () => {
            try {
                const res = await fetch(\`/api/copa2026/upload/verify-token?token=\${token}\`);
                const data = await res.json();

                if (res.status === 401) {
                    setStatus('invalid');
                    setError('Enlace inválido o token no reconocido. Verifica que hayas copiado el link completo de tu correo.');
                } else if (res.status === 410) {
                    setStatus('expired');
                    setError('El plazo de carga de videos ha vencido. (05/06/2026)');
                } else if (res.status === 200) {
                    setParticipante(data.participante);
                    if (data.isLoaded) {
                        setStatus('loaded');
                        setVideos(data.videos || []);
                    } else {
                        setStatus('pending');
                    }
                } else {
                    setStatus('invalid');
                    setError(data.error || 'Error desconocido.');
                }
            } catch (err) {
                setStatus('invalid');
                setError('Error de red al verificar el enlace.');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleUploadSuccess = async (fileUrl: string, fileData: any) => {
        setConfirming(true);
        try {
            const res = await fetch('/api/copa2026/upload/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenVideo: token,
                    videos: [fileData]
                })
            });

            const data = await res.json();
            
            if (res.ok && data.success) {
                setConfirmSuccess(true);
                if (data.warnings && data.warnings.length > 0) {
                    setWarnings(data.warnings);
                }
                setStatus('loaded');
            } else {
                throw new Error(data.error || 'Error al procesar el video.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al finalizar la carga del video.');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85439a]"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-[#85439a] tracking-tighter uppercase mb-2">COPA 2026</h1>
                    <h2 className="text-xl text-gray-700 font-medium">Recepción de Obras</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-[#85439a] to-[#6c367d] p-6 text-white">
                        <h3 className="text-2xl font-bold">Paso 2: Carga de Video</h3>
                        <p className="opacity-90 mt-1">Sube tu obra para la categoría de concurso.</p>
                    </div>

                    <div className="p-8">
                        {status === 'invalid' || status === 'expired' ? (
                            <div className="text-center py-10">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h3>
                                <p className="text-gray-600 text-lg mb-8">{error}</p>
                                <button 
                                    onClick={() => router.push('/')}
                                    className="px-6 py-3 bg-[#85439a] text-white font-bold rounded-xl hover:bg-opacity-90 transition-all"
                                >
                                    Volver al Inicio
                                </button>
                            </div>
                        ) : null}

                        {status === 'pending' && participante && !confirming && !confirmSuccess ? (
                            <div>
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">Hola, {participante.nombre} {participante.apellido}</h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>Estás cargando el video para la categoría <strong>{participante.categoria}</strong>.</p>
                                                <p className="mt-1">Recuerda que el video debe pesar menos de 500MB.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <VideoUploader token={token} onUploadSuccess={handleUploadSuccess} />
                                
                                {error && (
                                    <div className="mt-4 text-center text-red-600 text-sm font-medium">
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {confirming && (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85439a] mx-auto mb-4"></div>
                                <h3 className="text-xl font-bold text-gray-900">Analizando el Video...</h3>
                                <p className="text-gray-500 mt-2">Estamos ejecutando el análisis técnico de resolución y fotogramas. Por favor espera.</p>
                            </div>
                        )}

                        {(confirmSuccess || (status === 'loaded' && !confirming)) && (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">🎉</div>
                                <h3 className="text-3xl font-black text-green-600 mb-2">¡Video Recibido!</h3>
                                <p className="text-gray-600 text-lg mb-6">Tu video ha sido cargado y registrado en la plataforma exitosamente.</p>
                                
                                {warnings && warnings.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-8 text-left max-w-md mx-auto">
                                        <h4 className="flex items-center text-yellow-800 font-bold mb-2">
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                            Advertencias Técnicas
                                        </h4>
                                        <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-5">
                                            {warnings.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                        <p className="text-xs text-yellow-600 mt-3 font-medium">Nota: Tu video participa, pero las advertencias podrían restar puntos en evaluación técnica.</p>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-md mx-auto text-left">
                                    <h4 className="font-bold text-gray-900 mb-3 text-center">Siguientes Pasos</h4>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            Te enviamos un correo con la constancia y el reporte técnico.
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-[#85439a] font-bold mr-2">1.</span>
                                            Publica el video en tu Instagram (Perfil Público).
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-[#85439a] font-bold mr-2">2.</span>
                                            Menciona a <strong>@centauroads</strong> en la publicación.
                                        </li>
                                    </ul>
                                </div>

                                <button 
                                    onClick={() => router.push('/')}
                                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                                >
                                    Volver al Inicio
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
