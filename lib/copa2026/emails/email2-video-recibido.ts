import { sendEmail } from '@/lib/email-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function sendEmail2VideoRecibido(
    emailDestino: string, 
    nombre: string, 
    apellido: string, 
    categoria: string, 
    videosInfo: any[]
) {
    try {
        const configAdjunto = await prisma.configConcurso.findUnique({
            where: { clave: 'url_adjunto_registro_video' }
        });

        const attachments = [];
        if (configAdjunto?.valor && configAdjunto.valor.startsWith('http')) {
            attachments.push({
                filename: 'Instrucciones_Copa2026.pdf',
                path: configAdjunto.valor
            });
        }

        // Prepare attachments for videos under 35MB
        const validVideos = videosInfo
            .filter((v: any) => v.sizeBytes < 35 * 1024 * 1024)
            .map((v: any) => ({
                filename: v.fileName,
                path: v.urlVideo
            }));
            
        attachments.push(...validVideos);

        const emailHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #e53e3e;">🎄 Constancia de Participación</h1>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>¡Tu video ha sido recibido exitosamente y está listo para curaduría!</p>
            
            ${videosInfo.map((v: any) => `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0;">Categoría: ${categoria}</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Archivo:</strong> ${v.fileName}</li>
                    <li><strong>Tamaño:</strong> ${(Number(v.sizeBytes) / 1024 / 1024).toFixed(2)} MB</li>
                    <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-VE')}</li>
                    <li><strong>Participante:</strong> ${nombre} ${apellido}</li>
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
                        <td style="padding: 8px; border: 1px solid #ddd; color: ${Math.round(v.durationSeg || 0) <= 31 ? 'green' : 'red'};">${v.durationSeg ? v.durationSeg.toFixed(1) : 0}s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">Formato</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">video/mp4</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: ${v.fileType.includes('mp4') ? 'green' : 'red'};">${v.fileType}</td>
                    </tr>
                </table>

                ${v.warnings && v.warnings.length > 0 ? `
                <div style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffeeba; margin-top: 10px;">
                    <h4 style="margin-top: 0; color: #856404;">⚠️ Advertencias Técnicas</h4>
                    <ul style="color: #856404; font-size: 13px; padding-left: 20px;">
                        ${v.warnings.map((w: string) => `<li>${w}</li>`).join('')}
                    </ul>
                    <p style="font-size: 12px; margin-bottom: 0;">Nota: Tu video fue recibido, pero las desviaciones técnicas pueden afectar la evaluación del jurado.</p>
                </div>
                ` : ''}
            </div>
            `).join('')}

            <p style="font-size: 12px; color: #666;">* Hemos adjuntado una copia de tu video a este correo como respaldo (si pesa menos de 35MB).</p>

            <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin-top:0; color: #4f46e5;">🚀 Siguientes Pasos</h3>
                <p><strong>1️⃣ Publícalo en Instagram</strong><br>Sube tu video (Reel/Post) y menciona a @centauroads. ¡Tu perfil debe ser público!</p>
                <p><strong>2️⃣ Consigue Likes ❤️</strong><br>Comparte tu publicación. Los videos más votados pasarán a la ronda final.</p>
            </div>
        </div>
        `;

        await sendEmail({
            to: emailDestino,
            subject: '✅ Video Recibido Exitosamente - Copa 2026',
            html: emailHtml,
            attachments,
            tipo: 'VIDEO_RECIBIDO'
        });

        return { success: true };
    } catch (error) {
        console.error('Error enviando Email 2:', error);
        return { success: false, error };
    }
}
