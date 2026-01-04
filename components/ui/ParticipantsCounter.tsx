'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Bell } from 'lucide-react';

export default function ParticipantsCounter() {
    const [count, setCount] = useState(0);
    const [prevCount, setPrevCount] = useState(0);
    const [isWinking, setIsWinking] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/public/stats');
                if (res.data.success) {
                    const newTotal = res.data.data.totalVideos;
                    setCount(prev => {
                        if (newTotal > prev) {
                            triggerCelebration();
                        }
                        return newTotal;
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

    // Toggle Reveal Loop
    useEffect(() => {
        const toggleInterval = setInterval(() => {
            setIsWinking(prev => !prev);
        }, 4000); // Slower cycle: 4 seconds each state

        return () => clearInterval(toggleInterval);
    }, []);

    return (
        <section className="py-12 bg-black overflow-hidden relative border-y border-white/10">
            <div className="container mx-auto px-4 text-center relative z-10">

                {/* Header Animado */}
                <div className="mb-12 relative inline-block">
                    <h2 className="text-3xl md:text-4xl font-black text-yellow-400 uppercase tracking-tighter animate-tilt-shake relative z-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                        ¡Ya Están Participando!
                    </h2>

                    {/* Serpentinas Decorativas Lados */}
                    {showConfetti && (
                        <>
                            <div className="absolute -left-20 top-0 text-4xl animate-bounce-custom">🎊</div>
                            <div className="absolute -right-20 top-0 text-4xl animate-bounce-custom delay-75">🎉</div>
                        </>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex items-center justify-center gap-8 md:gap-16 min-h-[300px]">

                    {/* Left Decorations */}
                    <div className={`hidden md:block transition-all duration-1000 ${showConfetti ? 'scale-125 rotate-12' : 'scale-100'}`}>
                        <Bell size={48} className="text-red-500 animate-swing" />
                        <div className="text-4xl absolute -top-10 -left-10 animate-ping opacity-50">🎆</div>
                    </div>

                    {/* Central Santa & Number */}
                    <div className="relative w-80 h-80 flex items-center justify-center">

                        {/* Santa Face */}
                        <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out transform ${!isWinking ? 'scale-110 opacity-100' : 'scale-0 opacity-0'}`}
                        >
                            <div className="text-[200px] leading-none drop-shadow-2xl select-none">
                                🎅
                            </div>
                        </div>

                        {/* Number Overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out transform ${!isWinking ? 'scale-0 opacity-0' : 'scale-150 opacity-100'}`}>
                            <span className="text-[10rem] font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,1)] stroke-black leading-none"
                                style={{ textShadow: '6px 6px 0 #000, -2px -2px 0 #000' }}>
                                {count}
                            </span>
                        </div>
                    </div>

                    {/* Right Decorations */}
                    <div className={`hidden md:block transition-all duration-1000 ${showConfetti ? 'scale-125 -rotate-12' : 'scale-100'}`}>
                        <Bell size={48} className="text-red-500 animate-swing delay-150" />
                        <div className="text-4xl absolute -top-10 -right-10 animate-ping opacity-50 delay-100">🎆</div>
                    </div>

                </div>

                {/* Footer Text */}
                <div className="mt-8">
                    <p className="text-yellow-400 font-bold text-xl tracking-[0.5em] uppercase animate-pulse">
                        CONCURSANTES
                    </p>
                </div>

            </div>

            {/* Global Confetti Overlay */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden">
                    {/* CSS Particles */}
                    <div className="confetti-piece bg-red-500 left-10 animate-fall"></div>
                    <div className="confetti-piece bg-yellow-400 left-1/4 animate-fall delay-100"></div>
                    <div className="confetti-piece bg-blue-500 left-1/2 animate-fall delay-200"></div>
                    <div className="confetti-piece bg-green-500 left-3/4 animate-fall delay-300"></div>
                    <div className="confetti-piece bg-purple-500 right-10 animate-fall delay-75"></div>
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
                @keyframes swing {
                    0%, 100% { transform: rotate(0deg); }
                    20% { transform: rotate(15deg); }
                    40% { transform: rotate(-10deg); }
                    60% { transform: rotate(5deg); }
                    80% { transform: rotate(-5deg); }
                }
                .animate-swing {
                    animation: swing 2s infinite ease-in-out;
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
            `}</style>
        </section>
    );
}
