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
    const [stats, setStats] = useState<any>(null);
    
    // Status para el proceso de confirmación
    const [confirming, setConfirming] = useState(false);
    const [confirmSuccess, setConfirmSuccess] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    
    const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

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
                    setError('El plazo de carga de videos ha vencido.');
                } else if (res.status === 200) {
                    setParticipante(data.participante);
                    setStats(data.stats);
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

    useEffect(() => {
        if (!stats?.fechaCierre) return;
        const targetDate = new Date(stats.fechaCierre).getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;
            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            } else {
                setTimeLeft({
                    d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [stats?.fechaCierre]);

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
                // Si la carga fue exitosa, también queremos mostrar los videos retornados para ver la evaluación en vivo
                if (data.videos) {
                    setVideos(data.videos);
                }
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
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-[#85439a] tracking-tighter uppercase mb-2">COPA 2026</h1>
                    <h2 className="text-xl text-gray-700 font-medium">Recepción de Obras</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-[#85439a] to-[#6c367d] p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-2xl font-bold">Paso 2: Carga de Video</h3>
                            <p className="opacity-90 mt-1">Sube tu obra para la categoría de concurso.</p>
                        </div>
                        {timeLeft && (
                            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-center shadow-inner border border-white/10">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Cierre del Concurso</p>
                                <div className="flex gap-3 text-lg font-mono font-black">
                                    <div className="flex flex-col items-center"><span>{String(timeLeft.d).padStart(2, '0')}</span><span className="text-[10px] font-sans font-normal opacity-70">DÍAS</span></div>
                                    <span>:</span>
                                    <div className="flex flex-col items-center"><span>{String(timeLeft.h).padStart(2, '0')}</span><span className="text-[10px] font-sans font-normal opacity-70">HRS</span></div>
                                    <span>:</span>
                                    <div className="flex flex-col items-center"><span>{String(timeLeft.m).padStart(2, '0')}</span><span className="text-[10px] font-sans font-normal opacity-70">MIN</span></div>
                                    <span>:</span>
                                    <div className="flex flex-col items-center"><span>{String(timeLeft.s).padStart(2, '0')}</span><span className="text-[10px] font-sans font-normal opacity-70">SEG</span></div>
                                </div>
                            </div>
                        )}
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

                        {(status === 'pending' || status === 'loaded') && participante ? (
                            <div className="space-y-8">
                                {/* Profile Card */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start text-left relative overflow-hidden">
                                    {/* Decoration */}
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-gray-50 rounded-full border border-gray-100 z-0 opacity-50"></div>
                                    
                                    <div className="z-10 relative">
                                        {participante.fotoPerfilPath ? (
                                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#85439a]/20 shrink-0 shadow-inner">
                                                <Image 
                                                    src={participante.fotoPerfilPath} 
                                                    alt="Foto de perfil" 
                                                    fill 
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200 shrink-0 shadow-inner">
                                                <span className="text-4xl text-gray-400">👤</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 w-full z-10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 uppercase">
                                                    {participante.nombre} {participante.apellido}
                                                </h3>
                                                <p className="text-gray-500 font-mono text-sm">C.I: {participante.cedulaIdentidad}</p>
                                            </div>
                                            {participante.createdAt && (
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 uppercase font-bold">Fecha de Inscripción</p>
                                                    <p className="text-sm font-medium text-gray-600">
                                                        {new Date(participante.createdAt).toLocaleDateString('es-VE')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                                                <p className="text-xs text-gray-500 uppercase font-bold">Categoría</p>
                                                <p className="text-[#85439a] font-black">{participante.categoria}</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                                                <p className="text-xs text-gray-500 uppercase font-bold">Estatus de Pago</p>
                                                <div className="flex items-center gap-2">
                                                    {participante.estatusPago === 'VALIDADO' || participante.estatusPago === 'APROBADO' ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                    )}
                                                    <p className={`font-black ${participante.estatusPago === 'VALIDADO' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {participante.estatusPago || 'Pendiente'}
                                                    </p>
                                                </div>
                                                {participante.referenciaPago && (
                                                    <p className="text-[10px] text-gray-400 mt-1 font-mono">Ref: {participante.referenciaPago}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contest Stats Board */}
                                {stats && (
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-md text-white border border-gray-700">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                            Monitor del Concurso
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white/10 p-4 rounded-xl border border-white/5">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Concursantes Exigidos</p>
                                                <p className="text-2xl font-black">{stats.participantesRequeridos}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">Mínimo para validación</p>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-xl border border-white/5">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Inscritos Actuales</p>
                                                <p className="text-2xl font-black text-[#85439a]">{stats.totalInscritos}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">Registros recibidos</p>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-xl border border-white/5">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Videos Entregados</p>
                                                <p className="text-2xl font-black text-green-400">{stats.totalConVideos}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">Concursantes activos</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-[#85439a]/80 to-[#6c367d]/80 p-4 rounded-xl border border-[#85439a]">
                                                <p className="text-[10px] text-pink-200 uppercase font-bold">Premio del Público</p>
                                                <p className="text-2xl font-black text-white">${(stats.totalInscritos * stats.costoInscripcion).toFixed(2)}</p>
                                                <p className="text-[10px] text-pink-200/70 mt-1">{stats.totalInscritos} × ${stats.costoInscripcion} USD</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Characteristics Comparison */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-black text-gray-800 text-lg uppercase flex items-center gap-2">
                                            <svg className="w-5 h-5 text-[#85439a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                            Características del Video
                                        </h4>
                                        {status === 'pending' && <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">A la espera de carga</span>}
                                        {status === 'loaded' && <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Evaluación Completada</span>}
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3">Parámetro</th>
                                                    <th className="px-4 py-3">Esperado</th>
                                                    <th className="px-4 py-3 bg-white border-l border-gray-200">Entregado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['Resolución', 'Duración', 'Formato', 'FPS'].map((param, i) => {
                                                    const expected = param === 'Resolución' ? '1024x2048' : param === 'Duración' ? '25 - 30s' : param === 'Formato' ? 'MP4' : '30';
                                                    let delivered: any = 'Pendiente';
                                                    let isMet = false;
                                                    let hasVideo = videos && videos.length > 0;
                                                    
                                                    if (hasVideo) {
                                                        const v = videos[0];
                                                        if (param === 'Resolución') { delivered = v.resolution || 'N/A'; isMet = delivered === '1024x2048'; }
                                                        else if (param === 'Duración') { delivered = v.durationSeg ? `${v.durationSeg.toFixed(1)}s` : '0s'; isMet = (v.durationSeg || 0) >= 25 && (v.durationSeg || 0) <= 31; }
                                                        else if (param === 'Formato') { delivered = v.fileType || v.formato || 'N/A'; isMet = delivered.includes('mp4'); }
                                                        else if (param === 'FPS') { delivered = v.fps ? v.fps.toFixed(2) : 'N/A'; isMet = Math.abs((v.fps || 0) - 30) <= 1; }
                                                    }

                                                    return (
                                                        <tr key={param} className={i !== 3 ? "border-b border-gray-100" : ""}>
                                                            <td className="px-4 py-3 font-medium text-gray-800">{param}</td>
                                                            <td className="px-4 py-3 text-gray-500">{expected}</td>
                                                            <td className={`px-4 py-3 border-l border-gray-200 font-bold ${hasVideo ? (isMet ? 'text-green-600 bg-green-50/30' : 'text-red-500 bg-red-50/30') : 'text-gray-400 italic bg-white'}`}>
                                                                {delivered}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 font-medium flex items-center gap-1">
                                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        El incumplimiento de estas características no impide la carga del video, pero se notificará a los jueces e incidirá en los criterios de evaluación técnica.
                                    </p>
                                </div>

                                {/* Upload Zone */}
                                {status === 'pending' && !confirming && !confirmSuccess ? (
                                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                        <h4 className="font-black text-gray-800 text-lg uppercase mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-[#85439a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                            Zona de Carga
                                        </h4>
                                        <VideoUploader token={token} onUploadSuccess={handleUploadSuccess} />
                                        
                                        {error && (
                                            <div className="mt-4 text-center text-red-600 text-sm font-medium">
                                                {error}
                                            </div>
                                        )}
                                        
                                        {/* Disclaimer Reintegro */}
                                        {stats && (
                                            <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200 text-sm">
                                                <h5 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                    Políticas de Reintegro
                                                </h5>
                                                <p className="text-orange-700 mb-2">
                                                    Si no se han alcanzado el número mínimo de <strong>{stats.participantesRequeridos} participantes</strong> para considerar el concurso válido a la fecha de cierre, se procederá a reintegrar el 100% del monto de tu inscripción.
                                                </p>
                                                {participante.montoBs > 0 && (
                                                    <div className="bg-white/60 p-2 rounded border border-orange-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-orange-800">
                                                        <span><strong>Monto a reintegrar:</strong> {participante.montoBs} Bs</span>
                                                        <span><strong>Fecha de pago:</strong> {participante.fechaPago ? new Date(participante.fechaPago).toLocaleDateString('es-VE') : 'N/D'}</span>
                                                        <span><strong>Banco Origen:</strong> {participante.bancoPago || 'N/D'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {confirming && (
                                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85439a] mx-auto mb-4"></div>
                                        <h3 className="text-xl font-bold text-gray-900">Analizando el Video...</h3>
                                        <p className="text-gray-500 mt-2">Estamos ejecutando el análisis técnico de resolución y fotogramas. Por favor espera.</p>
                                    </div>
                                )}

                                {(confirmSuccess || (status === 'loaded' && !confirming)) && (
                                    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                                        <div className="text-6xl mb-4 animate-bounce">🎉</div>
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
                                                    <div className="flex-1 w-full overflow-hidden">
                                                        <p className="mb-2">Invita a tus conocidos y seguidores a que voten por tu video utilizando el siguiente enlace directo de votación:</p>
                                                        <div className="bg-white border border-gray-300 p-2 rounded flex items-center justify-between w-full">
                                                            <code className="text-[#85439a] font-bold select-all truncate mr-2 block w-full">https://copa2026.centauroads.com/votar/{token}</code>
                                                            <button onClick={() => navigator.clipboard.writeText(`https://copa2026.centauroads.com/votar/${token}`)} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded font-bold text-gray-700 transition shrink-0">COPIAR</button>
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
                        ) : null}
                    </div>
                </div>
            </div>
        </main>
    );
}
