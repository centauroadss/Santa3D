import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import VideoUploadClient from './VideoUploadClient';

const prisma = new PrismaClient();

export default async function DeferredVideoUploadPage({ params }: { params: { tokenVideo: string } }) {
    const { tokenVideo } = params;

    const inscripcion = await prisma.inscripcionCopa2026.findUnique({
        where: { tokenVideo }
    });

    if (!inscripcion) {
        return notFound();
    }

    if (inscripcion.tokenExpiry && new Date() > inscripcion.tokenExpiry) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="bg-[#111] p-10 rounded-2xl max-w-lg w-full text-center border border-white/10">
                    <div className="text-6xl mb-6">⏳</div>
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Enlace Expirado</h1>
                    <p className="text-gray-400">
                        El tiempo límite para subir tu obra ha finalizado.
                    </p>
                </div>
            </div>
        );
    }

    if (inscripcion.estatusInscripcion === 'COMPLETADO') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="bg-[#111] p-10 rounded-2xl max-w-lg w-full text-center border border-green-500/20">
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-2xl font-bold text-green-500 mb-4">Video Ya Cargado</h1>
                    <p className="text-gray-400">
                        Ya hemos recibido y procesado tu obra para esta inscripción. ¡Mucho éxito en la Copa!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white py-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-black text-brand-purple mb-2">Sube tu Obra ({inscripcion.categoria})</h1>
                    <p className="text-gray-400">
                        Hola {inscripcion.nombre}, por favor sube tu video final para completar tu participación.
                    </p>
                </div>
                
                <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <VideoUploadClient tokenVideo={tokenVideo} categoria={inscripcion.categoria} />
                </div>
            </div>
        </div>
    );
}
