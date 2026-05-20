'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, TrendingUp, Cpu, Monitor } from 'lucide-react';

export default function ParticipantsCounter() {
    const [stats, setStats] = useState({ total: 0, render: 0, ia: 0 });
    const [showConfetti, setShowConfetti] = useState(false);

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/public/stats');
                if (res.data.success) {
                    const newStats = {
                        total: res.data.data.totalInscritos,
                        render: res.data.data.countRender,
                        ia: res.data.data.countIA
                    };
                    
                    setStats(prev => {
                        if (newStats.total > prev.total && prev.total > 0) {
                            triggerCelebration();
                        }
                        return newStats;
                    });
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Celebration Trigger
    const triggerCelebration = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    };

    return (
        <section className="py-20 bg-[#050505] overflow-hidden relative border-y border-[#f48240]/20" id="premios">
            <div className="container mx-auto px-4 text-center relative z-10">

                {/* Header Animado */}
                <div className="mb-16 relative inline-block">
                    <h2 className="text-4xl md:text-5xl font-black text-[#f48240] uppercase tracking-tighter relative z-10 drop-shadow-[0_0_15px_rgba(244,130,64,0.3)]">
                        Contendientes Inscritos
                    </h2>
                    <p className="text-gray-400 mt-3 font-medium uppercase tracking-widest text-sm">
                        La carrera por el premio ha comenzado
                    </p>

                    {/* Serpentinas Decorativas */}
                    {showConfetti && (
                        <>
                            <div className="absolute -left-12 top-0 text-4xl animate-bounce-custom">⚽</div>
                            <div className="absolute -right-12 top-0 text-4xl animate-bounce-custom delay-75">🏆</div>
                        </>
                    )}
                </div>

                {/* Contadores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    
                    {/* Tarjeta RENDER */}
                    <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-[#f48240]/30 rounded-3xl p-8 transform transition-transform hover:scale-105 hover:border-[#f48240]/60 group relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#f48240]/5 rounded-full blur-2xl group-hover:bg-[#f48240]/10 transition-colors"></div>
                        <Monitor className="text-[#f48240] w-12 h-12 mx-auto mb-4 opacity-80" />
                        <h3 className="text-[#f48240] font-black text-xl uppercase tracking-widest mb-2">RENDER</h3>
                        <div className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            {stats.render}
                        </div>
                        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Participantes</p>
                    </div>

                    {/* Tarjeta TOTAL (Centro, Más Grande) */}
                    <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-[#7b46a9]/50 rounded-3xl p-10 transform transition-all hover:scale-105 hover:border-[#7b46a9] md:-translate-y-4 shadow-[0_0_40px_rgba(123,70,169,0.15)] group relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#7b46a9]/10 rounded-full blur-3xl group-hover:bg-[#7b46a9]/20 transition-colors"></div>
                        <div className="text-6xl mb-4 select-none drop-shadow-2xl mx-auto">🏆</div>
                        <h3 className="text-[#7b46a9] font-black text-2xl uppercase tracking-widest mb-2">TOTAL</h3>
                        <div className="text-7xl md:text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] leading-none">
                            {stats.total}
                        </div>
                        <p className="text-gray-400 text-sm mt-4 uppercase tracking-widest font-bold">Artistas 3D Compitiendo</p>
                    </div>

                    {/* Tarjeta IA */}
                    <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-[#f48240]/30 rounded-3xl p-8 transform transition-transform hover:scale-105 hover:border-[#f48240]/60 group relative overflow-hidden">
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#f48240]/5 rounded-full blur-2xl group-hover:bg-[#f48240]/10 transition-colors"></div>
                        <Cpu className="text-[#f48240] w-12 h-12 mx-auto mb-4 opacity-80" />
                        <h3 className="text-[#f48240] font-black text-xl uppercase tracking-widest mb-2">IA</h3>
                        <div className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            {stats.ia}
                        </div>
                        <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Participantes</p>
                    </div>

                </div>

            </div>

            {/* Global Confetti Overlay */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden z-50">
                    <div className="confetti-piece bg-[#f48240] left-10 animate-fall"></div>
                    <div className="confetti-piece bg-[#7b46a9] left-1/4 animate-fall delay-100"></div>
                    <div className="confetti-piece bg-white left-1/2 animate-fall delay-200"></div>
                    <div className="confetti-piece bg-[#f48240] left-3/4 animate-fall delay-300"></div>
                    <div className="confetti-piece bg-[#7b46a9] right-10 animate-fall delay-75"></div>
                </div>
            )}

            <style jsx>{`
                @keyframes tilt-shake {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(2deg); }
                    50% { transform: rotate(0deg); }
                    75% { transform: rotate(-2deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-tilt-shake {
                    animation: tilt-shake 0.2s infinite;
                }
                @keyframes fall {
                    0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(1000%) rotate(720deg); opacity: 0; }
                }
                .confetti-piece {
                    position: absolute;
                    width: 10px;
                    height: 20px;
                    top: -20px;
                }
                .animate-fall {
                    animation: fall 3s linear forwards;
                }
                @keyframes bounce-custom {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-bounce-custom {
                    animation: bounce-custom 1s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
}
