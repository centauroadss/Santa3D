'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
interface Judge {
    id: string;
    nombre: string;
    apellido: string;
    profesion: string;
    biografia: string;
    fotoUrl: string;
    instagram: string;
}
export default function JurySection() {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchJudges = async () => {
            try {
                const res = await axios.get('/api/public/judges');
                if (res.data.success) {
                    setJudges(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching jury:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJudges();
    }, []);
    if (isLoading || judges.length === 0) return null;
    return (
        <section className="py-20 bg-black/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-white mb-4">
                        Nuestro <span className="text-brand-purple">Jurado</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Conoce a los expertos encargados de evaluar la creatividad y técnica de los participantes.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {judges.map((judge) => (
                        <div key={judge.id} className="group relative">
                            {/* Card Content */}
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-brand-purple/50 transition-colors">
                                {/* Foto */}
                                <div className="aspect-[4/5] relative overflow-hidden bg-gray-900">
                                    {judge.fotoUrl ? (
                                        <img
                                            src={judge.fotoUrl}
                                            alt={judge.nombre}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/20">
                                            {judge.nombre.charAt(0)}
                                        </div>
                                    )}
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                </div>
                                {/* Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <h3 className="text-lg font-bold text-white mb-0.5 leading-tight">
                                        {judge.nombre} <br /> {judge.apellido}
                                    </h3>
                                    <p className="text-white/60 font-semibold text-sm uppercase tracking-wide truncate">
                                        {judge.profesion}
                                    </p>
                                    {/* Bio on Hover */}
                                    <p className="text-gray-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100 leading-tight bg-black/50 backdrop-blur-sm p-2 rounded max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                        {judge.biografia}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
