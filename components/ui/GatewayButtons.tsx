'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Video, Sparkles, ChevronLeft } from 'lucide-react';

interface GatewayButtonsProps {
    isClosed: boolean;
    hasVideos?: boolean;
}

export default function GatewayButtons({ isClosed, hasVideos = false }: GatewayButtonsProps) {
    if (isClosed) {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <div className="w-full sm:w-auto px-10 py-5 bg-gray-600 text-gray-300 rounded-2xl font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-3 shadow-none">
                    Convocatoria Cerrada
                </div>
                {hasVideos ? (
                    <Link href="/copa2026/votar" className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest transition-all">
                        Quiero Votar / Ver Videos
                    </Link>
                ) : (
                    <div title="Aún no tenemos video, pero sigue consultando, ¡pronto estarán los videos!" className="w-full sm:w-auto px-10 py-5 bg-gray-800 text-gray-500 border border-gray-700 rounded-2xl font-black uppercase tracking-widest cursor-not-allowed text-center">
                        Votar / Ver Videos
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
                href="/registro" 
                className="w-full sm:w-auto px-10 py-5 bg-brand-purple hover:bg-opacity-90 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-purple/20 flex items-center justify-center gap-3 group"
            >
                Quiero Participar
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {hasVideos ? (
                <Link href="/copa2026/votar" className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest transition-all">
                    Quiero Votar / Ver Videos
                </Link>
            ) : (
                <div title="Aún no tenemos video, pero sigue consultando, ¡pronto estarán los videos!" className="w-full sm:w-auto px-10 py-5 bg-gray-800 text-gray-500 border border-gray-700 rounded-2xl font-black uppercase tracking-widest cursor-not-allowed text-center">
                    Votar / Ver Videos
                </div>
            )}
        </div>
    );
}
