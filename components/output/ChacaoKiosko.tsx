'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
interface KioskoData {
    topParticipants: {
        alias: string;
        score: number;
        position: number;
    }[];
    totalVotes: number;
    countdown: string;
}
export default function ChacaoKiosko() {
    const [data, setData] = useState<KioskoData | null>(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/public/ranking');
                if (response.data.success) {
                    setData({
                        topParticipants: response.data.data,
                        totalVotes: 0,
                        countdown: '00:00:00',
                    });
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="w-full h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-between p-12 font-sans relative">
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-black pointer-events-none" />
            <div className="text-center z-10 space-y-4 pt-10">
                <h1 className="text-6xl font-black uppercase tracking-tighter">Santa 3D</h1>
                <div className="w-32 h-2 bg-red-600 mx-auto rounded-full" />
                <p className="text-2xl text-gray-400 tracking-widest uppercase">Resultados en Vivo</p>
            </div>
            <div className="w-full max-w-2xl z-10 space-y-8 flex-1 flex flex-col justify-center">
                {/* Top 1 Big */}
                {data && data.topParticipants[0] && (
                    <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 border border-yellow-500/50 p-10 rounded-3xl text-center transform scale-110">
                        <div className="text-6xl mb-4">👑</div>
                        <h2 className="text-6xl font-black mb-2">{data.topParticipants[0].alias}</h2>
                        <p className="text-4xl text-yellow-500 font-bold">{data.topParticipants[0].score.toFixed(0)} LIKES</p>
                    </div>
                )}
                {/* List */}
                <div className="space-y-4">
                    {data?.topParticipants.slice(1, 5).map((p) => (
                        <div key={p.position} className="flex items-center justify-between bg-white/10 p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-6">
                                <span className="text-4xl font-bold w-12 text-gray-500">#{p.position}</span>
                                <span className="text-3xl font-bold">{p.alias}</span>
                            </div>
                            <span className="text-3xl text-gray-300 font-mono">{p.score.toFixed(0)} ❤️</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="z-10 text-center pb-20">
                <p className="text-xl text-gray-500 uppercase tracking-widest mb-4">Escanea para votar</p>
                <div className="w-48 h-48 bg-white p-2 mx-auto rounded-lg">
                    <div className="w-full h-full bg-black/10 flex items-center justify-center text-black font-bold">QR CODE</div>
                </div>
            </div>
        </div>
    );
}
