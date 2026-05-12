import React from 'react';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Image from 'next/image';

const prisma = new PrismaClient();

export default async function VotarPage({ params }: { params: { token: string } }) {
    const token = params.token;
    
    // Buscar la inscripción correspondiente a este token de video
    const inscripcion = await prisma.inscripcionCopa2026.findUnique({
        where: { tokenVideo: token }
    });

    if (!inscripcion) {
        redirect('/');
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[500px] bg-[#85439a]/20 blur-[120px] rounded-full -z-10"></div>
            
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 max-w-xl w-full text-center shadow-2xl relative z-10">
                <div className="mb-6 flex justify-center">
                    {inscripcion.fotoPerfilPath ? (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#85439a] shadow-[0_0_30px_rgba(133,67,154,0.5)]">
                            <Image 
                                src={`https://santa3d.sfo3.digitaloceanspaces.com/${inscripcion.fotoPerfilPath}`} 
                                alt={`Foto de ${inscripcion.nombre}`} 
                                width={128}
                                height={128}
                                className="object-cover w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center border-4 border-gray-700">
                            <span className="text-4xl text-gray-500">👤</span>
                        </div>
                    )}
                </div>

                <div className="inline-block px-4 py-1 rounded-full bg-[#f79131]/10 text-[#f79131] text-xs font-black uppercase tracking-widest mb-4 border border-[#f79131]/20">
                    {inscripcion.categoria}
                </div>

                <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter uppercase">
                    {inscripcion.nombre} <span className="text-[#85439a]">{inscripcion.apellido}</span>
                </h1>
                
                <p className="text-gray-400 text-lg mb-8">
                    Está participando en la <strong className="text-white">Copa 2026: Tu Arte 3D Venezolano</strong>. 
                </p>

                <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
                        <h3 className="text-xl font-bold mb-3 flex items-center">
                            <span className="text-pink-500 mr-2">❤️</span> ¿Cómo Votar?
                        </h3>
                        <ol className="text-gray-300 space-y-3 text-sm list-decimal pl-5">
                            <li>El participante publicará pronto su video oficial en Instagram.</li>
                            <li>Búscalo en las menciones de <strong>@centauroads</strong> o en nuestro ranking en vivo.</li>
                            <li>Dale <strong className="text-pink-500">Like</strong> a su video en Instagram. ¡Cada like cuenta para llevarlo a la Gran Pantalla de Chacao!</li>
                        </ol>
                    </div>

                    <a 
                        href="/#ranking" 
                        className="block w-full py-4 bg-gradient-to-r from-[#85439a] to-[#6c367d] hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(133,67,154,0.4)] text-lg"
                    >
                        Ver Ranking en Vivo
                    </a>
                </div>
            </div>
            
            <p className="mt-8 text-gray-600 text-sm font-medium tracking-wider uppercase">
                Centauro ADS • Copa 2026
            </p>
        </main>
    );
}
