// components/ui/KioskoVideoPlayer.tsx
'use client';
import { X } from 'lucide-react';
interface Props {
    videoUrl: string;
    alias: string;
    instagram: string;
    score: number;
    position: number;
    isLikes?: boolean; // Required for type safety
    hiddenScore?: boolean;
    onClose: () => void;
}
export default function KioskoVideoPlayer({ videoUrl, alias, instagram, score, position, isLikes, hiddenScore, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[120]"
            >
                <X size={48} />
            </button>
            {/* KIOSKO CONTAINER */}
            <div className="relative w-full max-w-[60vh] h-[95vh] bg-black overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(220,38,38,0.3)] border-4 border-white/10 flex flex-col items-center animate-in zoom-in-50 slide-in-from-bottom-10 duration-700 ease-out">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 via-black to-black pointer-events-none" />
                {/* Header: Name & Position */}
                <div className="z-10 text-center pt-8 pb-4 w-full px-6 bg-gradient-to-b from-black/60 to-transparent animate-in slide-in-from-top-10 duration-700 delay-200 absolute top-0 left-0 right-0 pointer-events-none">
                    {/* Position - HUGE */}
                    <div className="mb-2">
                        <span className="text-yellow-500 font-black text-5xl uppercase tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 0px black' }}>
                            Puesto #{position}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter drop-shadow-md leading-none mb-1 text-shadow-sm">
                        {instagram}
                    </h2>
                    <p className="text-gray-300 text-xs uppercase tracking-wider font-medium opacity-80">
                        {alias}
                    </p>
                </div>
                {/* VIDEO DISPLAY - MAXIMIZED */}
                <div className="relative w-full h-full bg-black z-0">
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        controls
                        controlsList="nodownload"
                        disablePictureInPicture
                    />
                </div>
                {/* Footer: Score OR Likes */}
                <div className="z-10 absolute bottom-0 left-0 right-0 pb-10 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent text-center animate-in slide-in-from-bottom-10 duration-700 delay-300 pointer-events-none">
                    {!isLikes && !hiddenScore && (
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-1">
                            Votación Jueces
                        </p>
                    )}

                    {isLikes ? (
                        /* PHASE 1: LIKES DISPLAY */
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-6xl font-black text-pink-500 drop-shadow-[0_2px_10px_rgba(236,72,153,0.5)] leading-none">
                                {score}
                            </span>
                            <span className="text-4xl animate-pulse">❤️</span>
                        </div>
                    ) : (
                        /* PHASE 2: SCORE DISPLAY (JURY) */
                        !hiddenScore && (
                            <>
                                <div className="text-6xl font-black text-yellow-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)] leading-none">
                                    {score.toFixed(1)}
                                </div>
                                <div className="flex justify-center gap-2 mt-2">
                                    {/* Decremental Stars: Pos 1 = 5, Pos 2 = 4, etc. Min 1 to avoid crash */}
                                    {[...Array(Math.max(1, 6 - position))].map((_, i) => (
                                        <span key={i} className="text-yellow-500 text-sm drop-shadow-md">★</span>
                                    ))}
                                </div>
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
