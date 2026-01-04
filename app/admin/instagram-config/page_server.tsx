'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';

type TimerFormat = 'd-h' | 'd' | 'h' | 'h-m';
type PreviewMode = 'stored' | 'feed';

export default function InstagramConfigPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [rankings, setRankings] = useState<any[]>([]);

    // Estado base (D, H, M, S reales)
    const [rawTime, setRawTime] = useState<{ totalMs: number }>({ totalMs: 0 });

    // Config States
    const [timerFormat, setTimerFormat] = useState<TimerFormat>('d-h');
    const [activePreview, setActivePreview] = useState<PreviewMode>('stored');
    const [designMode, setDesignMode] = useState<'auto' | 'custom'>('auto');

    // Default Messages
    const [messagesParticipation, setMessagesParticipation] = useState<string>('¡$600 USD AL 1er LUGAR! - ¿Vas a dejar pasar la oportunidad?\n¡GANA $600 USD! - Es tu último chance para participar\n¡PREMIOS EN EFECTIVO! - El primer lugar se lleva $600 USD');
    const [messagesVoting, setMessagesVoting] = useState<string>('¡Tu voto cuenta! - Apoya a tu talento favorito\n¿Ya elegiste tu favorito? - Vota por el mejor Santa 3D\n¡Ayuda a elegir al ganador! - Dale like a los mejores videos');
    const [onlyApproved, setOnlyApproved] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false); // New Automation State

    // Refs for capture
    const storyRef = useRef<HTMLDivElement>(null);
    const feedRef = useRef<HTMLDivElement>(null);

    const DEADLINE = new Date('2025-12-30T23:59:59');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        Promise.all([fetchData(token), fetchConfig(token)]);

        const timer = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(timer);
    }, []);

    const updateTimer = () => {
        const now = new Date();
        const diff = DEADLINE.getTime() - now.getTime();
        setRawTime({ totalMs: diff > 0 ? diff : 0 });
    };

    const fetchConfig = async (token: string) => {
        try {
            const res = await axios.get('/api/admin/instagram-config', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.data) {
                const d = res.data.data;
                if (d.timerFormat) setTimerFormat(d.timerFormat);
                if (d.messagesParticipation) {
                    setMessagesParticipation(Array.isArray(d.messagesParticipation) ? d.messagesParticipation.join('\n') : d.messagesParticipation);
                }
                if (d.messagesVoting) {
                    setMessagesVoting(Array.isArray(d.messagesVoting) ? d.messagesVoting.join('\n') : d.messagesVoting);
                }
                if (d.designMode) setDesignMode(d.designMode);
                if (typeof d.onlyApproved !== 'undefined') setOnlyApproved(d.onlyApproved);
            }
        } catch (error) {
            console.warn('Could not fetch existing config, using defaults.', error);
        }
    };

    const fetchData = async (token: string) => {
        setIsLoading(true);
        try {
            const [statsRes, rankRes] = await Promise.all([
                axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/public/ranking', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }
            if (rankRes.data.success) {
                setRankings(rankRes.data.data);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFormattedTime = () => {
        const ms = rawTime.totalMs;
        const totalMinutes = Math.floor(ms / (1000 * 60));
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        const hoursRemainder = totalHours % 24;
        const minutesRemainder = totalMinutes % 60;

        switch (timerFormat) {
            case 'd':
                return { main: { val: totalDays, label: 'Días' }, secondary: null, text: `${totalDays}d` };
            case 'h':
                return { main: { val: totalHours, label: 'Horas' }, secondary: null, text: `${totalHours}h` };
            case 'h-m':
                return { main: { val: totalHours, label: 'Hrs' }, secondary: { val: minutesRemainder, label: 'Mins' }, text: `${totalHours}h ${minutesRemainder}m` };
            case 'd-h':
            default:
                return { main: { val: totalDays, label: 'Días' }, secondary: { val: hoursRemainder, label: 'Hrs' }, text: `${totalDays}d ${hoursRemainder}h` };
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('admin_token');
        try {
            const payload = {
                timerFormat,
                storyHours: ["8", "20"],
                feedHours: ["12"],
                messagesParticipation: messagesParticipation.split('\n'),
                messagesVoting: messagesVoting.split('\n'),
                onlyApproved,
                designMode
            };

            const res = await axios.post('/api/admin/instagram-config', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert('¡Configuración Guardada Correctamente!');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    // --- NEW: Test Publish Function (Automation) ---
    const handleTestPublish = async () => {
        if (!confirm(`¿Estás seguro de PUBLICAR AHORA MISMO una ${activePreview === 'stored' ? 'Historia' : 'Publicación'} en Instagram REAL?`)) return;

        setIsPublishing(true);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await axios.post('/api/admin/instagram/publish', {
                type: activePreview === 'stored' ? 'STORY' : 'FEED'
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                alert(`¡Éxito! Salida del Bot:\n${res.data.output}`);
            } else {
                alert(`Error: ${res.data.error}`);
            }
        } catch (error: any) {
            console.error('Publish error:', error);
            alert(`Error al publicar: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDownload = async () => {
        const element = activePreview === 'stored' ? storyRef.current : feedRef.current;
        if (!element) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                logging: false
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `instagram-${activePreview}-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Error al generar la imagen. Intenta de nuevo.');
        } finally {
            setIsDownloading(false);
        }
    };

    const timeDisplay = getFormattedTime();

    // USAMOS EL TOTAL DE VIDEOS (10) PARA EL CONTEO
    const ParticipantCount = stats?.videos?.total ?? 0;

    const rankingDisplay = rankings.length > 0 ? rankings : [];

    if (isLoading) return <div className="p-10 text-center">Cargando datos...</div>;

    const getFirstLine = (text: string) => text ? text.split('\n')[0] : '';

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <div className="w-64 bg-[#111111] text-white flex flex-col hidden md:flex flex-shrink-0 z-20">
                <div className="h-16 flex items-center justify-center border-b border-gray-800">
                    <span className="font-bold text-xl text-[#F26522]">CENTAURO ADS</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <a href="/admin/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">Dashboard</a>
                    <a href="#" className="block py-2.5 px-4 rounded bg-gray-800 border-l-4 border-[#F26522] font-bold text-white">Configuración IG</a>
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto relative z-10">
                <header className="bg-white shadow sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Automatización de Instagram</h1>
                        <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                                Sistema Activo
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#4a1d5c] hover:bg-purple-800 text-white font-bold py-2 px-4 rounded shadow disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

                    {/* SECCION 1: Formato Cuenta Regresiva */}
                    <div className="bg-white shadow rounded-lg mb-8 border-l-4 border-[#4a1d5c]">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                1. Formato de Cuenta Regresiva
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['d-h', 'd', 'h', 'h-m'].map((fmt) => (
                                    <label key={fmt} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="timer_format"
                                            className="peer sr-only"
                                            checked={timerFormat === fmt}
                                            onChange={() => setTimerFormat(fmt as TimerFormat)}
                                        />
                                        <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-[#F26522] peer-checked:bg-orange-50 transition-all text-center">
                                            <div className="text-lg font-bold text-gray-800">
                                                {fmt === 'd-h' && 'Días y Horas'}
                                                {fmt === 'd' && 'Solo Días'}
                                                {fmt === 'h' && 'Solo Horas'}
                                                {fmt === 'h-m' && 'Horas y Min'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {fmt === 'd-h' && 'Ej: 5d 12h'}
                                                {fmt === 'd' && 'Ej: 5 Días'}
                                                {fmt === 'h' && 'Ej: 48 Horas'}
                                                {fmt === 'h-m' && 'Ej: 12h 45m'}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECCION 2: Horarios */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                2. Horarios de Publicación
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Historias (Stories)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        08:00 AM <button className="ml-2 text-purple-600">×</button>
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        08:00 PM <button className="ml-2 text-purple-600">×</button>
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Publicaciones (Feed)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        12:00 PM <button className="ml-2 text-blue-600">×</button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCION 3: Personalizacion */}
                    <div className="bg-white shadow rounded-lg mb-8 z-20 relative">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                3. Personalización de Mensajes
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mensajes de "Participación" ($600 USD)</label>
                                <p className="text-xs text-gray-500 mb-2">Edita aquí el texto que aparecerá en la franja naranja de las Historias.</p>
                                <textarea
                                    rows={4}
                                    disabled={false}
                                    style={{ position: 'relative', zIndex: 50, opacity: 1 }}
                                    className="text-gray-900 shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                    value={messagesParticipation}
                                    onChange={(e) => setMessagesParticipation(e.target.value)}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mensajes de "Votación" (Comunidad)</label>
                                <p className="text-xs text-gray-500 mb-2">Edita aquí el texto cursivo del encabezado del Feed.</p>
                                <textarea
                                    rows={4}
                                    disabled={false}
                                    style={{ position: 'relative', zIndex: 50, opacity: 1 }}
                                    className="text-gray-900 shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                    value={messagesVoting}
                                    onChange={(e) => setMessagesVoting(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCION 4: Diseño y Publicación (Con Botones de Test) */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                4. Diseño y Publicación (Graph API)
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Vista Previa:</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setActivePreview('stored')}
                                        className={`flex-1 font-semibold py-3 px-4 rounded border shadow-sm flex items-center justify-center gap-2 transition-all ${activePreview === 'stored' ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
                                    >
                                        <span className="text-xl">📱</span> Historia
                                    </button>
                                    <button
                                        onClick={() => setActivePreview('feed')}
                                        className={`flex-1 font-semibold py-3 px-4 rounded border shadow-sm flex items-center justify-center gap-2 transition-all ${activePreview === 'feed' ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
                                    >
                                        <span className="text-xl">🖼️</span> Feed
                                    </button>
                                </div>

                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="w-full mt-4 bg-[#F26522] hover:bg-orange-600 text-white font-bold py-3 px-4 rounded shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mb-3"
                                >
                                    {isDownloading ? 'Generando...' : `Descargar Diseño ${activePreview === 'stored' ? '(Historia)' : '(Feed)'}`}
                                </button>

                                {/* BOTON DE PUBLICACION AUTOMATICA (NUEVO) */}
                                <button
                                    onClick={handleTestPublish}
                                    disabled={isPublishing}
                                    className={`w-full font-bold py-3 rounded text-white shadow transition-colors flex items-center justify-center gap-2 ${isPublishing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 animate-pulse'}`}
                                >
                                    {isPublishing ? 'Publicando en Instagram...' : `🚀 PUBLICAR REAL (TEST)`}
                                </button>
                                <p className="text-xs text-gray-500 mt-1 text-center">⚠️ Esto subirá la imagen inmediatamente a la cuenta conectada.</p>
                            </div>

                            <div className="border rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[400px]">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
                                    Vista Previa ({activePreview === 'stored' ? 'Historia' : 'Feed'})
                                </span>

                                {activePreview === 'stored' ? (
                                    /* STORY PREVIEW */
                                    <div ref={storyRef} className="w-[270px] h-[480px] bg-[#4a1d5c] rounded-xl border-none shadow-2xl relative overflow-hidden flex flex-col items-center select-none">
                                        {/* Header (Unified) */}
                                        <div className="w-full h-14 bg-purple-900 border-b border-orange-500 flex flex-col justify-center items-center pt-1 flex-shrink-0">
                                            <span className="text-[9px] text-[#F26522] font-bold tracking-[0.2em] leading-tight">CONCURSO SANTA 3D</span>
                                            <span className="text-[11px] text-white font-black tracking-[0.2em] leading-tight">VENEZOLANO</span>
                                            <div className="w-16 h-px bg-orange-500 mt-1"></div>
                                        </div>

                                        {/* Countdown Section */}
                                        <div className="mt-6 text-center z-10 flex-shrink-0">
                                            <div className="text-yellow-400 text-xs font-bold uppercase mb-1">Quedan Solo</div>
                                            <div className="flex justify-center items-end gap-1 text-white leading-none">
                                                <span className="text-6xl font-black block drop-shadow-md">{timeDisplay.main.val}</span>
                                                {timeDisplay.secondary && <span className="text-2xl font-bold mb-2 opacity-80">{timeDisplay.secondary.val}h</span>}
                                            </div>
                                            <span className="text-sm text-gray-300 font-bold uppercase tracking-[0.2em] block mt-1">{timeDisplay.main.label}</span>
                                        </div>

                                        {/* 1) Message MOVED to Center & Striking */}
                                        <div className="my-auto w-full px-4 z-20 flex-shrink-0 flex items-center justify-center">
                                            <div className="bg-[#F26522] text-white font-black text-center py-4 px-2 rounded transform -rotate-1 shadow-lg border-2 border-white/20 w-full shadow-orange-500/50">
                                                <span className="block text-lg uppercase leading-tight drop-shadow-sm italic">
                                                    {getFirstLine(messagesParticipation) || '¡PARTICIPA YA!'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 3) Ranking List (Replacing numeric stats) */}
                                        <div className="mt-auto w-full px-4 z-10 flex-grow-0 pb-4">
                                            <div className="text-left w-full bg-black/80 p-3 rounded-lg border border-white/10">
                                                <div className="text-[9px] font-bold text-gray-300 uppercase mb-2 border-b border-white/10 pb-1 flex justify-between">
                                                    <span>🔥 Liderando</span>
                                                    <span className="text-yellow-500">Likes</span>
                                                </div>

                                                {rankingDisplay.length > 0 ? (
                                                    rankingDisplay.slice(0, 3).map((r, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs mb-1.5 last:mb-0">
                                                            <span className="font-bold text-white truncate max-w-[140px] flex items-center gap-1">
                                                                <span className="text-sm">{i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'}</span>
                                                                {r.instagram || r.alias || 'Anon'}
                                                            </span>
                                                            <span className="font-mono font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                                                                {(r.score ?? r.likes ?? 0).toFixed(0)}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-[10px] text-gray-400 py-2">Sin datos aun</div>
                                                )}
                                            </div>

                                            <div className="mt-2 flex justify-center items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-medium">Participantes:</span>
                                                <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">{ParticipantCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* FEED PREVIEW */
                                    <div ref={feedRef} className="w-[320px] h-[400px] bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-white rounded-lg shadow-2xl relative overflow-hidden flex flex-col items-center select-none">

                                        {/* 1) Feed Header: Unified with Story */}
                                        <div className="w-full h-14 bg-purple-900 border-b border-orange-500 flex flex-col justify-center items-center pt-1 flex-shrink-0 absolute top-0 left-0 z-20">
                                            <span className="text-[9px] text-[#F26522] font-bold tracking-[0.2em] leading-tight">CONCURSO SANTA 3D</span>
                                            <span className="text-[11px] text-white font-black tracking-[0.2em] leading-tight">VENEZOLANO</span>
                                            <div className="w-16 h-px bg-orange-500 mt-1"></div>
                                        </div>

                                        <div className="pt-16 w-full px-6 flex flex-col h-full relative z-10 pb-12">

                                            {/* Message Striking - Fixed for html2canvas (No bg-clip-text) */}
                                            <div className="mb-4 text-center mt-2 flex-shrink-0">
                                                <div className="transform -rotate-1">
                                                    <p className="text-xl font-black text-yellow-500 leading-relaxed drop-shadow-md italic">
                                                        "{getFirstLine(messagesVoting) || '¡VOTA POR TU FAVORITO!'}"
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Ranking List */}
                                            <div className="text-left w-full bg-black/80 p-4 rounded-lg border border-white/10 mb-4 flex-grow-0">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 border-b border-white/10 pb-1 flex justify-between items-center">
                                                    <span>Top 3</span>
                                                    <span className="text-[9px] text-gray-500">Likes en Instagram</span>
                                                </div>

                                                {rankingDisplay.length > 0 ? (
                                                    rankingDisplay.slice(0, 3).map((r, i) => (
                                                        <div key={i} className="flex justify-between items-center text-sm mb-2 last:mb-0 py-0.5">
                                                            <span className="font-bold text-white truncate max-w-[160px] flex items-center gap-2 leading-relaxed">
                                                                <span className="text-sm">{i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'}</span>
                                                                {r.instagram || r.alias || 'Anon'}
                                                            </span>
                                                            <span className="font-mono font-bold text-yellow-400">
                                                                {(r.score ?? r.likes ?? 0).toFixed(0)}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-xs text-gray-500 py-2">Esperando datos...</div>
                                                )}
                                            </div>

                                            {/* Vertical Stats (New Design) */}
                                            <div className="flex flex-col items-center justify-center mt-auto mb-4 gap-1">
                                                <div className="text-center">
                                                    <span className="text-gray-300 font-bold italic text-sm">Solo falta </span>
                                                    <span className="text-[#ff0055] font-black italic text-sm">{timeDisplay.text}</span>
                                                    <span className="text-gray-300 font-bold italic text-sm"> para cerrar!</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-white font-bold text-xs uppercase tracking-wider">Participantes {ParticipantCount}</span>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Footer Removed (clean bottom) */}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
