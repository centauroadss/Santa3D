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
    biografia?: string;
    fotoPerfilUrl?: string;
    comprobanteUrl?: string;
}

export async function sendEmailConfirmacion(props: EmailConfirmacionProps) {
    const { nombre, email, categoria, montoBs, telefonoPago, tokenVideo, biografia, fotoPerfilUrl, comprobanteUrl } = props;
    
    // El dominio base debe configurarse en NEXT_PUBLIC_BASE_URL, si no, fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://copa2026.centauroads.com';
    const linkUpload = `${baseUrl}/registro/video/${tokenVideo}`;
    
    // Enmascarar teléfono (mostrar solo últimos 4 dígitos)
    const telMasked = telefonoPago.length >= 4 
        ? `****-***-${telefonoPago.slice(-4)}`
        : telefonoPago;

    // Calcular variables dinámicas adicionales
    const valorPremioCategoria = 'USD 300';
    const fechaLimiteConcurso = '05 de Junio, 2026';
    let numParticCategoria = 1;

    try {
        const count = await prisma.inscripcionCopa2026.count({
            where: { categoria: categoria as any, estatusInscripcion: 'APROBADO' }
        });
        numParticCategoria = count > 0 ? count : 1;
    } catch (err) {
        console.error('Error counting participants for email:', err);
    }

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
                .replace(/{{enlace_subida}}/g, `<a href="${linkUpload}" class="button" style="color: #fff;">Subir mi Video Ahora</a>`)
                .replace(/{{tokenVideo}}/g, tokenVideo)
                .replace(/{{valor_premio_Categoria}}/g, valorPremioCategoria)
                .replace(/{{num_partic_categoria}}/g, numParticCategoria.toString())
                .replace(/{{fecha_limite_concurso}}/g, fechaLimiteConcurso)
                .replace(/{{biografia}}/g, biografia || 'Sin biografía');
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
                <div class="details-row">
                    <span class="details-label">Nº Participante</span>
                    <span class="details-value">#${numParticCategoria}</span>
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
                    <li><strong>Fecha límite de carga:</strong> ${fechaLimiteConcurso} (23:59 VET)</li>
                </ul>
            </div>
        `;
    }

    // Agregar la sección visual de anexos al final del contenido
    const anexosHtml = `
        <div style="margin-top: 40px; border-top: 2px dashed #e5e7eb; padding-top: 20px;">
            <h3 style="color: #111827; font-size: 16px;">Tus Datos Registrados</h3>
            ${biografia ? `<p style="font-size: 14px; color: #4b5563; font-style: italic;">"${biografia}"</p>` : ''}
            
            <div style="display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap;">
                ${fotoPerfilUrl ? `
                <div style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: bold;">FOTO DE PERFIL</div>
                    <img src="${fotoPerfilUrl}" alt="Foto de perfil" style="width: 150px; height: 150px; object-fit: cover; border-radius: 50%; border: 3px solid #f3f4f6;" />
                </div>` : ''}

                ${comprobanteUrl ? `
                <div style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: bold;">COMPROBANTE DE PAGO</div>
                    <img src="${comprobanteUrl}" alt="Recibo" style="max-width: 100%; height: auto; max-height: 200px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
                </div>` : ''}
            </div>
        </div>
    `;

    const finalHtml = wrapWithCentauroTemplate(contenidoHtml + anexosHtml);

    return EmailService.send({
        to: email,
        subject: asunto,
        html: finalHtml,
        tipo: 'INSCRIPCION_CONFIRMADA' // Fundamental para el webhook tracking de lectura
    });
}
