import { EmailService } from '../../email-service';
import { prisma } from '@/lib/prisma';
import { wrapWithCentauroTemplate } from '@/lib/emails/centauro-template';

export interface EmailConfirmacionProps {
    nombre: string;
    email: string;
    categoria: string;
    montoBs: number;
    telefonoPago: string;
    tokenVideo: string;
}

export async function sendEmailConfirmacion(props: EmailConfirmacionProps) {
    const { nombre, email, categoria, montoBs, telefonoPago, tokenVideo } = props;
    
    // El dominio base debe configurarse en NEXT_PUBLIC_BASE_URL, si no, fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://copa2026.centauroads.com';
    const linkUpload = `${baseUrl}/registro/video/${tokenVideo}`;
    
    // Enmascarar teléfono (mostrar solo últimos 4 dígitos)
    const telMasked = telefonoPago.length >= 4 
        ? `****-***-${telefonoPago.slice(-4)}`
        : telefonoPago;

    let asunto = 'Copa 2026: Inscripción Confirmada y Token de Carga';
    let contenidoHtml = '';

    try {
        const plantilla = await prisma.plantillaEmail.findFirst({
            where: { tipo: 'INSCRIPCION_CONFIRMADA' }
        });

        if (plantilla) {
            asunto = plantilla.asunto;
            contenidoHtml = plantilla.contenidoHtml
                .replace(/{{nombre}}/g, nombre)
                .replace(/{{categoria}}/g, categoria)
                .replace(/{{montoBs}}/g, montoBs.toFixed(2))
                .replace(/{{telefonoPago}}/g, telMasked)
                .replace(/{{enlace_subida}}/g, `<a href="${linkUpload}" class="button">Subir mi Video Ahora</a>`)
                .replace(/{{tokenVideo}}/g, tokenVideo);
        }
    } catch (e) {
        console.error('Error fetching plantilla INSCRIPCION_CONFIRMADA:', e);
    }

    // Fallback if template not found
    if (!contenidoHtml) {
        contenidoHtml = `
            <div class="text-center mb-4">
                <div class="text-xl font-bold text-white mb-2">¡Inscripción Confirmada! 🎉</div>
                <div class="text-gray-400">Bienvenido a la Copa Santa 3D 2026</div>
            </div>
            
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Hemos recibido y validado exitosamente tu pago. Estás oficialmente inscrito en la categoría <strong>${categoria}</strong>.</p>
            
            <div class="details-box">
                <div class="details-row">
                    <span class="details-label">Categoría</span>
                    <span class="details-value">${categoria}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Monto Validado</span>
                    <span class="details-value">Bs. ${montoBs.toFixed(2)}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Teléfono Pago</span>
                    <span class="details-value">${telMasked}</span>
                </div>
            </div>

            <p>A continuación, tienes tu enlace único y privado para cargar tu video participante. Este enlace es intransferible.</p>
            
            <div class="button-container">
                <a href="${linkUpload}" class="button">Subir mi Video Ahora</a>
            </div>

            <div class="specs">
                <strong>Especificaciones Técnicas Estrictas del Video:</strong>
                <ul>
                    <li><strong>Resolución:</strong> 1024x2048 píxeles</li>
                    <li><strong>Duración:</strong> Entre 25 y 30 segundos</li>
                    <li><strong>Framerate:</strong> 30 FPS</li>
                    <li><strong>Formato:</strong> MP4 (H.264)</li>
                    <li><strong>Fecha límite de carga:</strong> 05 de Junio, 2026 (23:59 VET)</li>
                </ul>
            </div>
        `;
    }

    const finalHtml = wrapWithCentauroTemplate(contenidoHtml);

    return EmailService.send({
        to: email,
        subject: asunto,
        html: finalHtml
    });
}
