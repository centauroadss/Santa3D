'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCircle, ExternalLink } from 'lucide-react';

interface Participant {
    id: number;
    nombreCompleto: string;
    categoria: 'RENDER' | 'IA' | 'AMBAS';
    instagram: string | null;
    fotoUrl: string | null;
}

export default function ParticipantsList() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const res = await axios.get('/api/public/participants');
                if (res.data.success) {
                    setParticipants(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching participants:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, []);

    if (loading) {
        return (
            <div className="w-full max-w-3xl mx-auto mt-12 mb-20 text-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-8 w-64 bg-white/10 rounded"></div>
                    <div className="h-64 w-full bg-white/5 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (participants.length === 0) return null;

    return (
        <section className="w-full max-w-4xl mx-auto mt-12 mb-24 px-4" id="feed-participantes">
            <div className="bg-[#0a0a0a] border border-[#f48240]/20 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(244,130,64,0.05)]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-[#111] to-[#1a1a1a] border-b border-[#f48240]/20 p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">
                            Participantes Oficiales
                        </h3>
                        <p className="text-[#f48240] text-xs uppercase tracking-widest font-bold mt-1">
                            Talento 3D Venezolano
                        </p>
                    </div>
                    <div className="text-gray-500 font-mono text-sm">
                        {participants.length} Registros
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#7b46a9]/50 scrollbar-track-black p-2">
                    <div className="flex flex-col gap-2">
                        {participants.map((p) => (
                            <div 
                                key={p.id} 
                                className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#7b46a9]/30"
                            >
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 relative">
                                    {p.fotoUrl ? (
                                        <img 
                                            src={p.fotoUrl} 
                                            alt={p.nombreCompleto} 
                                            className="w-14 h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-[#f48240] transition-colors"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-gray-500 group-hover:border-[#f48240] group-hover:text-[#f48240] transition-colors">
                                            <UserCircle size={32} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-grow min-w-0">
                                    <h4 className="text-white font-bold text-lg truncate">
                                        {p.nombreCompleto}
                                    </h4>
                                    
                                    {/* Categories */}
                                    <div className="flex gap-2 mt-1.5">
                                        {(p.categoria === 'RENDER' || p.categoria === 'AMBAS') && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#f48240]/10 text-[#f48240] border border-[#f48240]/20">
                                                RENDER
                                            </span>
                                        )}
                                        {(p.categoria === 'IA' || p.categoria === 'AMBAS') && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#7b46a9]/10 text-[#7b46a9] border border-[#7b46a9]/20">
                                                IA
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Instagram Link */}
                                {p.instagram && (
                                    <a 
                                        href={`https://instagram.com/${p.instagram}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-[#7b46a9] hover:text-white text-gray-400 text-xs font-bold transition-all border border-white/10 hover:border-[#7b46a9]"
                                        title={`Visitar perfil de @${p.instagram}`}
                                    >
                                        <span>@{p.instagram}</span>
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
