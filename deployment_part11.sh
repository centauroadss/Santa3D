#!/bin/bash
# Part 11: Fix Instagram Config Preview Text & Layout
# Updates app/admin/instagram-config/page.tsx with corrected text and better layout for Feed.
cat << 'PAGE_EOF' > app/admin/instagram-config/page.tsx
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Clock, MessageSquare, Layout, Settings, Save, X, Eye, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
export default function InstagramConfigPage() {
    const router = useRouter();
    
    // --- STATE ---
    const [stats, setStats] = useState<any>(null);
    const [rankings, setRankings] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({ days: 0, hours: 0, minutes: 0 });
    const [isLoading, setIsLoading] = useState(true);
    // Mockup UI State
    const [storiesTime, setStoriesTime] = useState(['08:00 AM', '08:00 PM']);
    const [feedTime, setFeedTime] = useState(['12:00 PM']);
    const [newStoryTime, setNewStoryTime] = useState('12:00');
    const [newFeedTime, setNewFeedTime] = useState('12:00');
    
    // Messages
    const [messageStory, setMessageStory] = useState('¡$600 USD AL 1er LUGAR!\n¿Vas a dejar pasar la oportunidad?');
    const [messageFeed, setMessageFeed] = useState('¡Tu voto cuenta!\nApoya a tu talento favorito');
    // Design Mode
    const [designMode, setDesignMode] = useState<'auto' | 'custom'>('auto');
    // Preview Control
    const [previewType, setPreviewType] = useState<'story' | 'feed' | null>(null);
    // FIXED: Deadline 30/12/2025
    const DEADLINE = new Date('2025-12-30T23:59:59');
    // --- EFFECTS ---
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        fetchData(token);
        const timer = setInterval(updateTimer, 60000); 
        updateTimer(); 
        return () => clearInterval(timer);
    }, []);
    // --- LOGIC ---
    const updateTimer = () => {
        const now = new Date();
        const diff = DEADLINE.getTime() - now.getTime();
        if (diff <= 0) {
            setTimeLeft({ days: 0, hours: 0, minutes: 0 });
            return;
        }
        setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        });
    };
    const fetchData = async (token: string) => {
        setIsLoading(true);
        try {
            const [statsRes, rankRes] = await Promise.all([
                axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/rankings?limit=5', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (statsRes.data.success) setStats(statsRes.data.data);
            if (rankRes.data.success) setRankings(rankRes.data.data.rankings);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };
    // Actions
    const addStoryTime = () => {
        if (!newStoryTime) return;
        setStoriesTime([...storiesTime, newStoryTime]);
    };
    const removeStoryTime = (idx: number) => {
        setStoriesTime(storiesTime.filter((_, i) => i !== idx));
    };
    const addFeedTime = () => {
        if (!newFeedTime) return;
        setFeedTime([...feedTime, newFeedTime + ' PM']); 
    };
    const removeFeedTime = (idx: number) => {
        setFeedTime(feedTime.filter((_, i) => i !== idx));
    };
    // Using Video Count
    const participantCount = stats?.videos?.total || 0;
    // --- PREVIEW COMPONENT ---
    const PreviewContent = ({ type }: { type: 'story' | 'feed' }) => {
        // Message Selection
        const messageToShow = type === 'story' ? messageStory : messageFeed;
        const containerClass = type === 'story' 
            ? "w-[360px] h-[640px] rounded-0 md:rounded-3xl" 
            : "w-[400px] h-[500px] rounded-sm"; 
        
        // REDUCED PADDING FOR FEED TO PREVENT OVERFLOW
        const paddingClass = type === 'story' ? 'py-12 px-6' : 'py-6 px-6';
        return (
            <div className={`\${containerClass} relative overflow-hidden flex flex-col items-center justify-between \${paddingClass} shadow-2xl transition-all select-none`}>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4a1d5c] via-[#6d2a8a] to-[#F26522] z-0"></div>
                
                {/* Content */}
                <div className="relative z-10 w-full flex flex-col h-full justify-between items-center text-white">
                    
                    {/* 1. HEADER */}
                    <div className="text-center w-full pt-2 flex-shrink-0">
                        <h1 className="font-black text-3xl leading-none tracking-tighter uppercase text-white drop-shadow-md">
                            CONCURSO SANTA 3D
                        </h1>
                        <h2 className="font-bold text-xl tracking-[0.2em] uppercase opacity-90 leading-tight">
                            VENEZOLANO
                        </h2>
                        {/* Line BELOW the text */}
                        <div className="w-full h-0.5 bg-white/40 mt-3 rounded-full"></div>
                    </div>
                    {/* 2. DYNAMIC STATS */}
                    <div className="flex flex-col items-center gap-4 w-full flex-grow justify-center mt-2">
                         {/* Time Left */}
                         <div className="text-center w-full">
                            {/* UPDATED TEXT: Tan solo quedan */}
                            <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80 text-yellow-300">
                                Tan solo quedan
                            </p>
                            
                            <div className="flex gap-3 justify-center">
                                <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 min-w-[80px] border border-white/20">
                                    <span className="block text-4xl font-black text-[#F26522]">{timeLeft.days}</span>
                                    <span className="text-[10px] uppercase font-bold text-white">Días</span>
                                </div>
                                <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 min-w-[80px] border border-white/20">
                                    <span className="block text-4xl font-black text-[#F26522]">{timeLeft.hours}</span>
                                    <span className="text-[10px] uppercase font-bold text-white">Horas</span>
                                </div>
                            </div>
                            {/* ADDED TEXT: para que tu tambien participes */}
                            <p className="text-xs text-white/90 mt-2 font-medium tracking-wide">
                                para que tú también participes
                            </p>
                        </div>
                         {/* Participants */}
                         <div className="text-center w-full">
                            <span className="text-5xl md:text-6xl font-black text-white filter drop-shadow-lg block leading-none">
                                {participantCount}
                            </span>
                            <div className="text-sm font-bold uppercase tracking-widest bg-[#F26522] text-white px-3 py-1 rounded-full inline-block mt-2 shadow-lg">
                                Concursantes
                            </div>
                        </div>
                    </div>
                    {/* 3. RANKING / LEADERBOARD INFO */}
                    <div className="w-full bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10 mt-2 flex-shrink-0">
                        <div className="text-xs font-bold uppercase text-center text-gray-300 mb-2 border-b border-white/10 pb-1 flex justify-between items-center px-2">
                            <span>🔥 Top 5 Ranking</span>
                            <span className="text-[10px] opacity-60">Likes</span>
                        </div>
                        <div className="space-y-1">
                            {rankings.slice(0, 5).map((r, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2 overflow-hidden max-w-[70%]">
                                        <div className={`font-black w-4 text-center \${i === 0 ? 'text-yellow-400 text-sm' : 'text-gray-400'}`}>#{i+1}</div>
                                        <span className="truncate font-semibold text-white/90">
                                            @{r.instagram ? r.instagram.replace('@', '') : (r.alias || 'Anonimo')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-pink-400 font-bold bg-white/10 px-1.5 py-0.5 rounded-md min-w-[35px] justify-center">
                                        <Heart size={8} fill="currentColor" />
                                        <span>{r.instagramLikes !== undefined ? r.instagramLikes : (r.score?.toFixed(0) || 0)}</span>
                                    </div>
                                </div>
                            ))}
                            {rankings.length === 0 && <div className="text-center text-xs opacity-50 italic py-2">Sin datos de ranking aún...</div>}
                        </div>
                    </div>
                    {/* 4. MESSAGE FOOTER */}
                    {/* Added flex-shrink-0 to ensure it doesn't disappear in Feed */}
                    <div className="w-full text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 mt-2 min-h-[50px] flex items-center justify-center flex-shrink-0">
                       <p className="text-white font-medium leading-tight text-xs whitespace-pre-wrap">
                           {messageToShow || '...'}
                       </p>
                    </div>
                </div>
            </div>
        );
    };
    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Cargando datos...</div>;
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            {/* HEADER */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Automatización de Instagram</h1>
                    <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                            Sistema Activo
                        </span>
                        <button className="bg-[#4a1d5c] hover:bg-purple-800 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm">
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* 1. HORARIOS */}
                <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                            <Clock className="text-[#F26522]" size={20} />
                            1. Horarios de Publicación
                        </h3>
                        <span className="text-sm text-gray-500">Zona Horaria: America/Caracas</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Stories Col */}
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Historias (Stories)</label>
                            <p className="text-xs text-gray-500 mb-4">Se publicarán automáticamente en formato vertical.</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {storiesTime.map((time, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        {time}
                                        <button onClick={() => removeStoryTime(idx)} className="ml-2 text-purple-600 hover:text-purple-900 font-bold focus:outline-none">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="time" 
                                    className="shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                    value={newStoryTime}
                                    onChange={(e) => setNewStoryTime(e.target.value)}
                                />
                                <button 
                                    onClick={addStoryTime}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#F26522] hover:bg-orange-600 focus:outline-none transition-colors"
                                >
                                    + Agregar
                                </button>
                            </div>
                        </div>
                        {/* Feed Col */}
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Publicaciones (Feed)</label>
                            <p className="text-xs text-gray-500 mb-4">Se publicarán en el perfil principal.</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {feedTime.map((time, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {time}
                                        <button onClick={() => removeFeedTime(idx)} className="ml-2 text-blue-600 hover:text-blue-900 font-bold focus:outline-none">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="time" 
                                    className="shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                    value={newFeedTime}
                                    onChange={(e) => setNewFeedTime(e.target.value)}
                                />
                                <button 
                                    onClick={addFeedTime}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#F26522] hover:bg-orange-600 focus:outline-none transition-colors"
                                >
                                    + Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 2. CONFIGURACIÓN DE CONTENIDO */}
                <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                            <MessageSquare className="text-[#F26522]" size={20} />
                            2. Configuración de Contenido
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Mensaje en Historia (Story)</label>
                            <p className="text-xs text-gray-500 mb-2">Texto que se mostrará en el preview de las historias.</p>
                            <textarea 
                                rows={4} 
                                className="shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                value={messageStory}
                                onChange={(e) => setMessageStory(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Mensaje en Post (Feed/Reel)</label>
                            <p className="text-xs text-gray-500 mb-2">Texto que se mostrará en el preview del feed.</p>
                            <textarea 
                                rows={4} 
                                className="shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                value={messageFeed}
                                onChange={(e) => setMessageFeed(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                {/* 3. DISEÑO & PREVIEW */}
                <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                            <Layout className="text-[#F26522]" size={20} />
                            3. Diseño de Publicaciones
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-4">Modo de Diseño</h4>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input 
                                        id="design-auto" 
                                        name="design-mode" 
                                        type="radio" 
                                        checked={designMode === 'auto'}
                                        onChange={() => setDesignMode('auto')}
                                        className="h-4 w-4 text-[#F26522] focus:ring-[#F26522] border-gray-300" 
                                    />
                                    <label htmlFor="design-auto" className="ml-3 block text-sm font-medium text-gray-700">
                                        Automático (Generado por Código)
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 ml-7 mb-2">Usa colores corporativos y data en vivo.</p>
                                <div className="flex items-center">
                                    <input 
                                        id="design-custom" 
                                        name="design-mode" 
                                        type="radio"
                                        checked={designMode === 'custom'}
                                        onChange={() => setDesignMode('custom')}
                                        className="h-4 w-4 text-[#F26522] focus:ring-[#F26522] border-gray-300" 
                                    />
                                    <label htmlFor="design-custom" className="ml-3 block text-sm font-medium text-gray-700">
                                        Personalizado (Subir Fondo)
                                    </label>
                                </div>
                            </div>
                        </div>
                        {/* PREVIEW ACTIONS */}
                        <div className="border rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center text-center">
                            <h5 className="font-medium text-gray-900 mb-4">Ver Previsualización en Vivo</h5>
                            <p className="text-xs text-gray-500 mb-6 max-w-xs">
                                Genera los diseños con la data actual (Rankings, Contador) y los mensajes escritos arriba.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <button 
                                    onClick={() => setPreviewType('story')}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4a1d5c] text-white rounded-lg hover:bg-purple-900 transition-colors shadow-md font-bold text-sm"
                                >
                                    <Eye size={18} /> 
                                    Preview Historia
                                </button>
                                <button 
                                    onClick={() => setPreviewType('feed')}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F26522] text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md font-bold text-sm"
                                >
                                    <Eye size={18} />
                                    Preview Feed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 4. OPCIONES AVANZADAS */}
                <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                            <Settings className="text-[#F26522]" size={20} />
                            Opciones Avanzadas
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Color de Urgencia</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-red-600 border border-gray-300 cursor-pointer ring-2 ring-offset-2 ring-red-500"></div>
                                    <div className="w-8 h-8 rounded-full bg-orange-500 border border-white cursor-pointer opacity-80"></div>
                                    <div className="w-8 h-8 rounded-full bg-yellow-500 border border-white cursor-pointer opacity-80"></div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                                <select className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm">
                                    <option>Normal (6 horas)</option>
                                    <option>Intensiva (2 horas)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Regresiva</label>
                                <div className="flex items-center">
                                    <input type="checkbox" defaultChecked className="h-4 w-4 text-[#F26522] focus:ring-[#F26522] border-gray-300 rounded" />
                                    <span className="ml-2 text-sm text-gray-600">Milisegundos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* PREVIEW MODAL */}
            {previewType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
                    <div className="relative flex flex-col items-center w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={() => setPreviewType(null)}
                            className="text-white mb-4 flex items-center gap-2 hover:text-gray-300 transition-colors font-bold uppercase tracking-wider text-sm"
                        >
                            <X size={24} /> Cerrar Preview
                        </button>
                        
                        <PreviewContent type={previewType} />
                        <p className="text-white/30 text-xs mt-6 text-center">
                            * Captura esta pantalla para usar en Instagram. <br/>
                            Data en vivo desde la base de datos.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
