import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { analyzeVideo } from '@/lib/copa2026/video-validation';
import { sendEmail2VideoRecibido } from '@/lib/copa2026/emails/email2-video-recibido';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { tokenVideo, videos } = await req.json();

        // 1. Validar Token
        const inscripcion = await prisma.inscripcionCopa2026.findUnique({
            where: { tokenVideo }
        });

        if (!inscripcion || (inscripcion.tokenExpiry && new Date() > inscripcion.tokenExpiry)) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
        }

        if (inscripcion.estatusInscripcion === 'COMPLETADO' || inscripcion.estatusToken === 'USADO') {
            return NextResponse.json({ error: 'El video ya fue cargado' }, { status: 400 });
        }

        // 2. Procesar cada video subido (Validación Técnica Real)
        const videosData = [];
        const videosInfoParaEmail = [];

        for (const v of videos) {
            let analysis;
            try {
                // Descargar y ejecutar ffprobe
                analysis = await analyzeVideo(v.urlVideo);
            } catch (err) {
                console.error('Error analizando video con ffprobe:', err);
                // Fallback si falla ffprobe pero el archivo existe
                analysis = {
                    resolution: v.resolution || 'unknown',
                    durationSeg: Math.round(v.durationSeg || 0),
                    fps: 30,
                    formato: v.fileType || 'video/mp4',
                    warnings: ['No se pudo analizar técnicamente el archivo.']
                };
            }

            const videoRecord = {
                rutaS3: v.urlVideo,
                nombreArchivo: v.fileName,
                tamanoBytes: BigInt(v.sizeBytes || 0),
                duracionSeg: Math.round(analysis.durationSeg),
                resolucion: analysis.resolution,
                fps: analysis.fps,
                formato: analysis.formato,
                warnings: analysis.warnings,
                estatus: 'RECIBIDO'
            };

            videosData.push(videoRecord);
            
            // Info para el correo
            videosInfoParaEmail.push({
                ...videoRecord,
                urlVideo: v.urlVideo,
                fileType: analysis.formato,
            });
        }

        // 3. Actualizar Inscripción y crear registros de Video
        // Ignoramos el error ts sobre el tipo de 'estatus' en Prisma si lo hubiere
        await prisma.inscripcionCopa2026.update({
            where: { id: inscripcion.id },
            data: {
                estatusInscripcion: 'COMPLETADO',
                estatusToken: 'USADO',
                videos: {
                    createMany: {
                        data: videosData as any
                    }
                }
            }
        });

        // 4. Enviar Email de Validación de Video
        await sendEmail2VideoRecibido(
            inscripcion.email,
            inscripcion.nombre,
            inscripcion.apellido,
            inscripcion.categoria,
            videosInfoParaEmail,
            inscripcion.tokenVideo
        );

        return NextResponse.json({ success: true, warnings: videosInfoParaEmail.map(v => v.warnings).flat() });

    } catch (error) {
        console.error('Error confirming video upload:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
