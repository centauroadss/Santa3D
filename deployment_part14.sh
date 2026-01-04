#!/bin/bash
# Part 14: Add Download Functionality to Instagram Config
# Installs html2canvas and updates page.tsx with download logic.
# 1. Install html2canvas dependency (using legacy-peer-deps to avoid conflicts)
npm install html2canvas --legacy-peer-deps
# 2. Update page.tsx
cat << 'PAGE_EOF' > app/admin/instagram-config/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Clock, MessageSquare, Layout, Settings, Save, X, Eye, Heart, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import html2canvas from 'html2canvas';
export default function InstagramConfigPage() {
    const router = useRouter();
    
    // --- STATE ---
    const [stats, setStats] = useState<any>(null);
    // Rankings state kept to avoid errors if referenced, but unused in UI now
    const [rankings, setRankings] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({ days: 0, hours: 0, minutes: 0 });
    const [isLoading, setIsLoading] = useState(true);
    // Mockup UI State
    const [storiesTime, setStoriesTime] = useState(['08:00 AM', '08:00 PM']);
    const [feedTime, setFeedTime] = useState(['12:00 PM']);
    const [newStoryTime, setNewStoryTime] = useState('12:00');
    const [newFeedTime, setNewFeedTime] = useState('12:00');
    
    // Messages
    const [messageStory, setMessageStory] = useState('¡$600 USD AL 1er LUGAR!\n¿Vas a dejar pasar la oportunidad? 🚀🔥');
    const [messageFeed, setMessageFeed] = useState('¡Tu voto cuenta!\nApoya a tu talento favorito ✨👾');
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
        // Load saved config from localStorage if available
        const savedConfig = localStorage.getItem('instagram_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.storiesTime) setStoriesTime(config.storiesTime);
                if (config.feedTime) setFeedTime(config.feedTime);
                if (config.messageStory) setMessageStory(config.messageStory);
                if (config.messageFeed) setMessageFeed(config.messageFeed);
                if (config.designMode) setDesignMode(config.designMode);
            } catch (e) {
                console.error("Error parsing saved config", e);
            }
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
    
    // SAVE Config
    const handleSave = () => {
        const config = {
            storiesTime,
            feedTime,
            messageStory,
            messageFeed,
            designMode
        };
        localStorage.setItem('instagram_config', JSON.stringify(config));
        alert('✅ Cambios guardados correctamente en la configuración.');
    };
    // DOWNLOAD Config
    const handleDownload = async (type: 'story' | 'feed') => {
        const elementId = type === 'story' ? 'preview-story' : 'preview-feed';
        const element = document.getElementById(elementId);
        
        if (!element) {
            alert('Error: No se encontró el elemento para descargar.');
            return;
        }
        
        try {
            // Wait a moment for images to render if any
            const canvas = await html2canvas(element, {
                useCORS: true, 
                backgroundColor: null, // Transparent if needed
                scale: 2, // High resolution
            });
            
            const image = canvas.toDataURL("image/png");
            
            // Create download link
            const link = document.createElement('a');
            link.href = image;
            link.download = `santa3d-${type}-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
            
        } catch (error) {
            console.error('Download failed:', error);
            alert('Hubo un error al generar la imagen. Intenta de nuevo.');
        }
    };
    // Using Video Count
    const participantCount = stats?.videos?.total || 0;
    // --- PREVIEW COMPONENT ---
    const PreviewContent = ({ type }: { type: 'story' | 'feed' }) => {
        const id = type === 'story' ? 'preview-story' : 'preview-feed';
        // Message Selection
        const messageToShow = type === 'story' ? messageStory : messageFeed;
        const containerClass = type === 'story' 
            ? "w-[360px] h-[640px] rounded-0 md:rounded-3xl" 
            : "w-[400px] h-[500px] rounded-sm"; 
        
        const paddingClass = type === 'story' ? 'py-12 px-6' : 'py-8 px-8';
        return (
            // Add ID for downloading
            <div id={id} className={`\${containerClass} relative overflow-hidden flex flex-col items-center justify-between \${paddingClass} shadow-2xl transition-all select-none`}>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4a1d5c] via-[#6d2a8a] to-[#F26522] z-0"></div>
                
                {/* Content */}
                <div className="relative z-10 w-full flex flex-col h-full items-center text-white">
                    
                    {/* 1. HEADER (Top fixed) */}
                    <div className="text-center w-full pt-2 flex-shrink-0 mb-8">
                        <h1 className="font-black text-3xl leading-none tracking-tighter uppercase text-white drop-shadow-md">
                            CONCURSO SANTA 3D
                        </h1>
                        <h2 className="font-bold text-xl tracking-[0.2em] uppercase opacity-90 leading-tight">
                            VENEZOLANO
                        </h2>
                        <div className="w-full h-0.5 bg-white/40 mt-3 rounded-full"></div>
                    </div>
                    {/* 2. DYNAMIC STATS (Center Top) */}
                    <div className="flex flex-col items-center gap-6 w-full justify-center mb-8">
                         {/* Time Left */}
                         <div className="text-center w-full">
                            <p className="text-sm font-bold uppercase tracking-widest mb-3 opacity-90 text-yellow-300">
                                Tan solo quedan
                            </p>
                            
                            <div className="flex gap-4 justify-center">
                                <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 min-w-[90px] border border-white/20 transform scale-110">
                                    <span className="block text-5xl font-black text-[#F26522]">{timeLeft.days}</span>
                                    <span className="text-[10px] uppercase font-bold text-white tracking-wider">Días</span>
                                </div>
                                <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 min-w-[90px] border border-white/20 transform scale-110">
                                    <span className="block text-5xl font-black text-[#F26522]">{timeLeft.hours}</span>
                                    <span className="text-[10px] uppercase font-bold text-white tracking-wider">Horas</span>
                                </div>
                            </div>
                            <p className="text-sm text-white/95 mt-4 font-bold tracking-wide">
                                para que tú también participes
                            </p>
                        </div>
                         {/* Participants - Slightly smaller to emphasize message */}
                         <div className="text-center w-full opacity-90 scale-90">
                            <span className="text-5xl font-black text-white filter drop-shadow-lg block leading-none">
                                {participantCount}
                            </span>
                            <div className="text-xs font-bold uppercase tracking-widest bg-[#F26522] text-white px-3 py-1 rounded-full inline-block mt-1 shadow-lg">
                                Concursantes
                            </div>
                        </div>
                    </div>
                    {/* 3. MESSAGE AREA (Replaces Ranking) - Filling remaining space */}
                    <div className="w-full flex-grow flex items-center justify-center p-2">
                        <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex items-center justify-center min-h-[160px] shadow-inner">
                            <p className="text-white font-bold text-2xl md:text-3xl text-center leading-snug whitespace-pre-wrap drop-shadow-lg">
                                {messageToShow || 'Escribe tu mensaje aquí...'}
                            </p>
                        </div>
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
                        <button 
                            onClick={handleSave} 
                            className="bg-[#4a1d5c] hover:bg-purple-800 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm"
                        >
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
                            <p className="text-xs text-gray-500 mb-2">Escribe tu mensaje con Emojis 🚀✨</p>
                            <textarea 
                                rows={4} 
                                className="shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                value={messageStory}
                                onChange={(e) => setMessageStory(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Mensaje en Post (Feed/Reel)</label>
                            <p className="text-xs text-gray-500 mb-2">Escribe tu mensaje con Emojis 🚀✨</p>
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
                        {/* PREVIEW ACTIONS - NOW WITH DOWNLOAD */}
                        <div className="border rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center text-center">
                            <h5 className="font-medium text-gray-900 mb-4">Ver Previsualización en Vivo</h5>
                            <p className="text-xs text-gray-500 mb-6 max-w-xs">
                                Genera los diseños con la data actual (Contador y Mensajes). Ya no se incluye el Ranking.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-4">
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
            </main>
            {/* PREVIEW MODAL */}
            {previewType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
                    <div className="relative flex flex-col items-center w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full flex justify-between mb-4">
                            <button 
                                onClick={() => setPreviewType(null)}
                                className="text-white flex items-center gap-2 hover:text-gray-300 transition-colors font-bold uppercase tracking-wider text-sm"
                            >
                                <X size={24} /> Cerrar
                            </button>
                            {/* DOWNLOAD BUTTON IN MODAL */}
                            <button 
                                onClick={() => handleDownload(previewType)}
                                className="bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
                            >
                                <Download size={18} /> Descargar Imagen
                            </button>
                        </div>
                        
                        <PreviewContent type={previewType} />
                        <p className="text-white/30 text-xs mt-6 text-center">
                            * La descarga puede tardar unos segundos en procesarse.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
