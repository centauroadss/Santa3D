import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export const revalidate = 60; // Revalidate every minute

export default async function Copa2026Landing() {
    // Check if there are any approved videos to enable the voting button
    const approvedVideosCount = await prisma.videoCopa2026.count({
        where: {
            estatus: 'APROBADO'
        }
    });

    const votingEnabled = approvedVideosCount > 0;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
            <div className="max-w-3xl w-full text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-pulse-slow">
                        Copa Santa 3D
                        <span className="block text-3xl md:text-5xl mt-2 text-white/90">2026</span>
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed">
                        El reto definitivo para creadores digitales. Demuestra tu talento en Renderizado o Inteligencia Artificial.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12">
                    {/* Botón Participar */}
                    <Link 
                        href="/copa2026/inscripcion"
                        className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)] w-full md:w-auto"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Participar Ahora
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                        </span>
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-red-500 to-orange-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></div>
                    </Link>

                    {/* Botón Votar */}
                    <div className="w-full md:w-auto relative group">
                        {votingEnabled ? (
                            <Link 
                                href="/copa2026/votar"
                                className="block px-8 py-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full font-bold text-lg transition-all w-full text-center"
                            >
                                Votar / Ver Videos
                            </Link>
                        ) : (
                            <button 
                                disabled
                                className="w-full px-8 py-4 bg-neutral-900 border border-neutral-800 text-neutral-600 rounded-full font-bold text-lg cursor-not-allowed"
                            >
                                Votar / Ver Videos
                            </button>
                        )}
                        
                        {/* Tooltip para botón deshabilitado */}
                        {!votingEnabled && (
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-neutral-800 text-sm text-neutral-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Disponible cuando se cargue el primer video
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                            <span className="text-red-500 text-2xl">🎨</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Categoría Render</h3>
                        <p className="text-neutral-400 text-sm">Modelado, texturizado y renderizado 3D tradicional utilizando software como Blender, Maya, C4D, etc.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                            <span className="text-orange-500 text-2xl">🤖</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Categoría IA</h3>
                        <p className="text-neutral-400 text-sm">Generación de video asistida por Inteligencia Artificial utilizando herramientas como Midjourney, Runway, Pika, etc.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
