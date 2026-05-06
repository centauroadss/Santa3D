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

        if (inscripcion.estatusInscripcion === 'COMPLETADO') {
            return NextResponse.json({ error: 'El video ya fue cargado' }, { status: 400 });
        }

        // Preparar array de datos para Prisma
        const videosData = videos.map((v: any) => ({
            rutaS3: v.urlVideo,
            nombreArchivo: v.fileName,
            tamanoBytes: BigInt(v.sizeBytes || 0),
            duracionSeg: Math.round(v.durationSeg || 0),
            resolucion: v.resolution,
            formato: v.fileType,
            estatus: 'RECIBIDO'
        }));

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
        if (process.env.RESEND_API_KEY) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            let emailHtml = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #e53e3e;">🎄 Constancia de Participación</h1>
                <p>Hola <strong>${inscripcion.nombre}</strong>,</p>
                <p>¡Tus obras han sido recibidas exitosamente y están listas para curaduría!</p>
                
                ${videos.map((v: any) => `
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0;">Categoría: ${v.categoriaVideo || inscripcion.categoria}</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Archivo:</strong> ${v.fileName}</li>
                        <li><strong>Tamaño:</strong> ${(v.sizeBytes / 1024 / 1024).toFixed(2)} MB</li>
                        <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-VE')}</li>
                        <li><strong>Participante:</strong> ${inscripcion.nombre} ${inscripcion.apellido}</li>
                    </ul>
                    <p>✅ El concursante aceptó los términos y condiciones del concurso.</p>
                    <p>✅ El anunciante confirmó seguir la cuenta de @centauroads en Instagram.</p>

                    <h4>📋 Reporte Técnico del Video</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr style="background: #eee;">
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Dato</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Esperado</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Recibido</th>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">Resolución</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">1024x2048</td>
                            <td style="padding: 8px; border: 1px solid #ddd; color: ${v.resolution === '1024x2048' ? 'green' : 'red'};">${v.resolution}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">Duración</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">30s</td>
                            <td style="padding: 8px; border: 1px solid #ddd; color: ${Math.round(v.durationSeg || 0) === 30 ? 'green' : 'red'};">${v.durationSeg ? v.durationSeg.toFixed(1) : 0}s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">Formato</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">video/mp4</td>
                            <td style="padding: 8px; border: 1px solid #ddd; color: ${v.fileType === 'video/mp4' ? 'green' : 'red'};">${v.fileType}</td>
                        </tr>
                    </table>
                </div>
                `).join('')}

                <p style="font-size: 12px; color: #666;">* Hemos adjuntado una copia de tus videos a este correo como respaldo (si pesan menos de 35MB).</p>

                <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h3 style="margin-top:0; color: #4f46e5;">🚀 Siguientes Pasos</h3>
                    <p><strong>1️⃣ Publícalo en Instagram</strong><br>Sube tu video (Reel/Post) y menciona a @centauroads. ¡Tu perfil debe ser público!</p>
                    <p><strong>2️⃣ Consigue Likes ❤️</strong><br>Comparte tu publicación. Los videos más votados pasarán a la ronda final.</p>
                </div>
            </div>
            `;

            // Prepare attachments for videos under 35MB
            const validAttachments = videos
                .filter((v: any) => v.sizeBytes < 35 * 1024 * 1024)
                .map((v: any) => ({
                    filename: v.fileName,
                    path: v.urlVideo
                }));

            await resend.emails.send({
                from: 'Copa 2026 <no-reply@centauroads.com>',
                to: inscripcion.email,
                subject: '✅ Video Recibido Exitosamente - Copa 2026',
                html: emailHtml,
                attachments: validAttachments
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error confirming video upload:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
