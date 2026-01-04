// components/ui/PublicResults.tsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '@/components/ui/Card';
import KioskoVideoPlayer from '@/components/ui/KioskoVideoPlayer';
interface RankingEntry {
    id: string;
    alias: string;
    instagram: string;
    score: number;
    position: number;
    streamUrl?: string; // Now robust from server
    isLikes?: boolean;
    hiddenScore?: boolean;
}
export default function PublicResults() {
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<RankingEntry | null>(null);
    useEffect(() => {
        fetchRanking();
        // Time reduced to 5s
        const interval = setInterval(fetchRanking, 5000);
        return () => clearInterval(interval);
    }, []);
    const fetchRanking = async () => {
        try {
            // Cache busting param - Clean syntax
            const response = await axios.get(`/api/public/ranking?t=${Date.now()}`);
            if (response.data.success) {
                setRanking(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching ranking:', error);
        } finally {
            setLoading(false);
        }
    };
    if (loading) return <div className="text-center text-gray-500">Cargando resultados...</div>;
    return (
        <>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Top 1 - Destacado */}
                {ranking.length > 0 && (
                    <Card
                        onClick={() => ranking[0].streamUrl && setSelectedVideo(ranking[0])}
                        className="md:col-span-2 border-yellow-500/50 bg-yellow-500/5 overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform duration-300 group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="text-9xl">👑</div>
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-4xl font-black text-black shadow-lg shadow-yellow-500/50">
                                1
                            </div>
                            <div>
                                <p className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-1">Liderando la tabla</p>
                                <h3 className="text-3xl font-black text-white mb-1">
                                    {ranking[0].instagram} <span className="text-yellow-500/60 font-medium text-xl ml-2">{ranking[0].alias}</span>
                                </h3>
                                {/* Conditional Score Display */}
                                {!ranking[0].hiddenScore && (
                                    <p className="text-2xl font-bold flex items-center gap-2 text-gray-400">
                                        {ranking[0].isLikes ? (
                                            <span className="text-pink-500">{ranking[0].score} Likes ❤️</span>
                                        ) : (
                                            <span>{ranking[0].score.toFixed(1)} pts</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                    </Card>
                )}
                {/* Resto del Top 5 */}
                {ranking.slice(1, 5).map((entry) => (
                    <div
                        key={entry.id}
                        onClick={() => entry.streamUrl && setSelectedVideo(entry)}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-brand-purple/50 transition-all active:scale-95"
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-white">
                            {entry.position}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-white">
                                {entry.instagram} <span className="text-gray-400 font-normal text-sm ml-2">{entry.alias}</span>
                            </h4>
                            {/* Conditional Score Display */}
                            {!entry.hiddenScore && (
                                <p className="font-bold flex items-center gap-2">
                                    {entry.isLikes ? (
                                        <span className="text-pink-500">{entry.score} Likes ❤️</span>
                                    ) : (
                                        <span className="text-brand-purple">{entry.score.toFixed(1)} pts</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                {ranking.length === 0 && (
                    <div className="md:col-span-2 text-center py-12 text-gray-500">
                        Aún no hay videos en el Ranking Público.
                    </div>
                )}
            </div>
            {/* KIOSKO PLAYER MODAL */}
            {selectedVideo && selectedVideo.streamUrl && (
                <KioskoVideoPlayer
                    videoUrl={selectedVideo.streamUrl}
                    alias={selectedVideo.alias}
                    instagram={selectedVideo.instagram}
                    position={selectedVideo.position}
                    score={selectedVideo.score}
                    isLikes={selectedVideo.isLikes}
                    hiddenScore={selectedVideo.hiddenScore} // New Prop
                    onClose={() => setSelectedVideo(null)}
                />
            )}
        </>
    );
}
