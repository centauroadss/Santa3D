'use client';
import { useEffect, useState } from 'react';
export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    useEffect(() => {
        // Fecha de cierre: 30 de Diciembre 2025 a la medianoche
        const targetDate = new Date('2025-12-30T23:59:59').getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const difference = targetDate - now;
            if (difference <= 0) {
                clearInterval(interval);
            } else {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="w-full max-w-4xl mx-auto mb-12">
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse-slow">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-90"></div>
                <div className="relative z-10 p-4 md:p-5 text-center text-white">
                    <h3 className="text-xl md:text-2xl font-black italic tracking-wider mb-4 text-yellow-300 drop-shadow-md">
                        ⏰ QUEDAN SOLO {timeLeft.days} DÍAS
                    </h3>
                    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-4 font-mono">
                        <div className="flex flex-col items-center animate-pulse">
                            <span className="text-4xl md:text-6xl font-bold bg-black/30 rounded-lg px-4 py-2 border border-white/20 backdrop-blur-sm min-w-[80px]">
                                {String(timeLeft.days).padStart(2, '0')}
                            </span>
                            <span className="text-sm md:text-base uppercase mt-2 font-bold tracking-widest opacity-90">Días</span>
                        </div>
                        <span className="text-4xl md:text-6xl font-black text-red-200 animate-pulse">:</span>
                        <div className="flex flex-col items-center animate-pulse">
                            <span className="text-4xl md:text-6xl font-bold bg-black/30 rounded-lg px-4 py-2 border border-white/20 backdrop-blur-sm min-w-[80px]">
                                {String(timeLeft.hours).padStart(2, '0')}
                            </span>
                            <span className="text-sm md:text-base uppercase mt-2 font-bold tracking-widest opacity-90">Horas</span>
                        </div>
                        <span className="text-4xl md:text-6xl font-black text-red-200 animate-pulse">:</span>
                        <div className="flex flex-col items-center animate-pulse">
                            <span className="text-4xl md:text-6xl font-bold bg-black/30 rounded-lg px-4 py-2 border border-white/20 backdrop-blur-sm min-w-[80px]">
                                {String(timeLeft.minutes).padStart(2, '0')}
                            </span>
                            <span className="text-sm md:text-base uppercase mt-2 font-bold tracking-widest opacity-90">Min</span>
                        </div>
                        <span className="text-4xl md:text-6xl font-black text-red-200 animate-pulse hidden md:inline">:</span>
                        <div className="flex flex-col items-center hidden md:flex animate-pulse">
                            <span className="text-4xl md:text-6xl font-bold bg-black/30 rounded-lg px-4 py-2 border border-white/20 backdrop-blur-sm min-w-[80px]">
                                {String(timeLeft.seconds).padStart(2, '0')}
                            </span>
                            <span className="text-sm md:text-base uppercase mt-2 font-bold tracking-widest opacity-90">Seg</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg md:text-xl font-bold text-white tracking-tight">
                            Asegura tu participación antes del cierre
                        </p>
                        <p className="text-sm md:text-base text-red-100 font-medium">
                            El plazo es hasta el 30 de Diciembre 2025 a la media noche
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
