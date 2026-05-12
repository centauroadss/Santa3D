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
                const res = await fetch(`/api/copa2026/upload/verify-token?token=${token}`);
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
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start text-left">
                                    {participante.fotoPerfilPath ? (
                                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#85439a]/20 shrink-0">
                                            <Image 
                                                src={`https://santa3d.sfo3.digitaloceanspaces.com/${participante.fotoPerfilPath}`} 
                                                alt="Foto de perfil" 
                                                fill 
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200 shrink-0">
                                            <span className="text-4xl text-gray-400">👤</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 w-full">
                                        <h3 className="text-2xl font-black text-gray-900 uppercase">
                                            {participante.nombre} {participante.apellido}
                                        </h3>
                                        <p className="text-gray-500 font-mono text-sm mb-4">C.I: {participante.cedulaIdentidad}</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-xs text-gray-500 uppercase font-bold">Categoría</p>
                                                <p className="text-[#85439a] font-bold">{participante.categoria}</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-xs text-gray-500 uppercase font-bold">Estatus de Pago</p>
                                                <div className="flex items-center gap-2">
                                                    {participante.estatusPago === 'VALIDADO' || participante.estatusPago === 'APROBADO' ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                    )}
                                                    <p className={`font-bold ${participante.estatusPago === 'VALIDADO' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {participante.estatusPago || 'Pendiente'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {participante.referenciaPago && (
                                            <p className="text-xs text-gray-400 mt-3 text-right">
                                                Ref: {participante.referenciaPago}
                                            </p>
                                        )}
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

                                {videos.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto text-left shadow-sm">
                                        <h4 className="font-black text-[#85439a] mb-4 text-center text-lg uppercase border-b pb-2">Resultados de Evaluación Técnica</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-700 uppercase font-bold">
                                                    <tr>
                                                        <th className="px-4 py-3 rounded-tl-lg">Parámetro</th>
                                                        <th className="px-4 py-3">Esperado</th>
                                                        <th className="px-4 py-3 rounded-tr-lg">Entregado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {videos.map((v, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <tr className="border-b">
                                                                <td className="px-4 py-3 font-medium">Resolución</td>
                                                                <td className="px-4 py-3 text-gray-500">1024x2048</td>
                                                                <td className={`px-4 py-3 font-bold ${v.resolution === '1024x2048' ? 'text-green-600' : 'text-red-500'}`}>{v.resolution || 'N/A'}</td>
                                                            </tr>
                                                            <tr className="border-b">
                                                                <td className="px-4 py-3 font-medium">Duración</td>
                                                                <td className="px-4 py-3 text-gray-500">25 - 30s</td>
                                                                <td className={`px-4 py-3 font-bold ${(v.durationSeg || 0) >= 25 && (v.durationSeg || 0) <= 31 ? 'text-green-600' : 'text-red-500'}`}>{v.durationSeg ? v.durationSeg.toFixed(1) : 0}s</td>
                                                            </tr>
                                                            <tr className="border-b">
                                                                <td className="px-4 py-3 font-medium">Formato</td>
                                                                <td className="px-4 py-3 text-gray-500">MP4</td>
                                                                <td className={`px-4 py-3 font-bold ${v.fileType?.includes('mp4') || v.formato?.includes('mp4') ? 'text-green-600' : 'text-red-500'}`}>{v.fileType || v.formato || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="px-4 py-3 font-medium rounded-bl-lg">FPS</td>
                                                                <td className="px-4 py-3 text-gray-500 rounded-br-lg">30</td>
                                                                <td className={`px-4 py-3 font-bold ${Math.abs((v.fps || 0) - 30) <= 1 ? 'text-green-600' : 'text-red-500'}`}>{v.fps ? v.fps.toFixed(2) : 'N/A'}</td>
                                                            </tr>
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-2xl mx-auto text-left shadow-inner border border-gray-200">
                                    <h4 className="font-bold text-gray-900 mb-4 text-center text-lg">Siguientes Pasos (Importante)</h4>
                                    <div className="space-y-4 text-sm text-gray-700">
                                        <div className="flex items-start">
                                            <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 shrink-0">✓</div>
                                            <p>Se ha emitido automáticamente un correo electrónico a tu bandeja con los resultados de esta evaluación técnica y la constancia de entrega.</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="bg-[#f79131] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 shrink-0">1</div>
                                            <p>Sube este mismo video a tu cuenta pública de <strong>Instagram</strong> (como Reel o Post) y compártelo/etiqueta obligatoriamente a la cuenta <strong>@centauroads</strong>.</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="bg-[#85439a] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 shrink-0">2</div>
                                            <div>
                                                <p className="mb-2">Invita a tus conocidos y seguidores a que voten por tu video utilizando el siguiente enlace directo de votación:</p>
                                                <div className="bg-white border border-gray-300 p-2 rounded flex items-center justify-between">
                                                    <code className="text-[#85439a] font-bold select-all truncate mr-2">https://copa2026.centauroads.com/votar/{token}</code>
                                                    <button onClick={() => navigator.clipboard.writeText(`https://copa2026.centauroads.com/votar/${token}`)} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700 transition">Copiar</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
