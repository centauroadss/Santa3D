import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { tokenVideo, videos } = await req.json();

        // Validar Token
        const inscripcion = await prisma.inscripcionCopa2026.findUnique({
            where: { tokenVideo }
        });

        if (!inscripcion || (inscripcion.tokenExpiry && new Date() > inscripcion.tokenExpiry)) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
        }

        const deadline = new Date('2026-06-05T23:59:59Z');
        if (inscripcion.estatusInscripcion === 'COMPLETADO') {
            if (new Date() > deadline) {
                return NextResponse.json({ error: 'El video ya fue cargado y el plazo de reemplazo venció.' }, { status: 400 });
            } else {
                // Borrar videos anteriores si está reemplazando
                await prisma.videoCopa2026.deleteMany({
                    where: { inscripcionId: inscripcion.id }
                });
            }
        }

        // Procesar cada video subido con FFProbe
        const { analyzeVideo } = await import('@/lib/copa2026/video-validation');
        const videosData = [];
        
        for (const v of videos) {
            let analysisResults = { warnings: [] as string[], fps: null as number | null };
            let finalDuration = Math.round(v.durationSeg || 0);
            let finalResolution = v.resolution;
            let finalFormat = v.fileType;

            try {
                // Descargar y validar temporalmente
                const validation = await analyzeVideo(v.urlVideo);
                analysisResults.warnings = validation.warnings;
                
                if (validation.fps) analysisResults.fps = validation.fps;
                if (validation.duration) finalDuration = validation.duration;
                if (validation.resolution) finalResolution = validation.resolution;
                if (validation.format) finalFormat = validation.format;

                // Extra warnings for format and fps if not caught
                if (!finalFormat || !finalFormat.includes('mp4')) {
                    analysisResults.warnings.push('Formato incorrecto. Se esperaba video/mp4 (H.264).');
                }
                if (!analysisResults.fps || Math.abs(analysisResults.fps - 30) > 1) {
                    analysisResults.warnings.push(`Los FPS (${analysisResults.fps || 'N/A'}) no coinciden con los 30 exigidos.`);
                }
            } catch (err) {
                console.error('Error analyzing video with ffprobe:', err);
                analysisResults.warnings.push('No se pudo verificar técnicamente el video (Error en FFProbe).');
            }

            videosData.push({
                rutaS3: v.urlVideo,
                nombreArchivo: v.fileName,
                tamanoBytes: BigInt(v.sizeBytes || 0),
                duracionSeg: finalDuration,
                resolucion: finalResolution,
                formato: finalFormat,
                fps: analysisResults.fps,
                warnings: analysisResults.warnings,
                estatus: 'RECIBIDO'
            });
            
            // Add warnings and fps to the client payload object for the email template
            v.warnings = analysisResults.warnings;
            v.fps = analysisResults.fps;
            v.durationSeg = finalDuration;
            v.resolution = finalResolution;
            v.formato = finalFormat;
        }

        // Actualizar Inscripción y crear registros de Video
        await prisma.inscripcionCopa2026.update({
            where: { id: inscripcion.id },
            data: {
                estatusInscripcion: 'COMPLETADO',
                estatusToken: 'USADO',
                videos: {
                    createMany: {
                        data: videosData
                    }
                }
            }
        });

        // 4. Enviar Email de Validación de Video
        const { sendEmail2VideoRecibido } = await import('@/lib/copa2026/emails/email2-video-recibido');
        await sendEmail2VideoRecibido(
            inscripcion.email,
            inscripcion.nombre,
            inscripcion.apellido,
            inscripcion.categoria,
            videos
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error confirming video upload:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
