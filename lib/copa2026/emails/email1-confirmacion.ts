import { EmailService } from '../../email-service';

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
    const linkUpload = `${baseUrl}/copa2026/upload/${tokenVideo}`;
    
    // Enmascarar teléfono (mostrar solo últimos 4 dígitos)
    const telMasked = telefonoPago.length >= 4 
        ? `****-***-${telefonoPago.slice(-4)}`
        : telefonoPago;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Inter', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border: 1px solid #222; border-radius: 12px; margin-top: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #fff; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #888; }
            .content { font-size: 15px; line-height: 1.6; color: #ddd; }
            .details-box { background-color: #111; border: 1px solid #333; padding: 20px; border-radius: 8px; margin: 25px 0; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 10px; }
            .details-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
            .details-label { color: #888; }
            .details-value { font-weight: bold; color: #fff; }
            .button-container { text-align: center; margin: 35px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #FF3366 0%, #FF9933 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; }
            .specs { background-color: #1a1a1a; padding: 20px; border-radius: 8px; font-size: 14px; color: #bbb; border-left: 4px solid #FF3366; }
            .specs ul { margin-top: 10px; padding-left: 20px; }
            .specs li { margin-bottom: 6px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="title">¡Inscripción Confirmada! 🎉</div>
                <div class="subtitle">Bienvenido a la Copa Santa 3D 2026</div>
            </div>
            
            <div class="content">
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
                    <strong>Especificaciones Técnicas del Video:</strong>
                    <ul>
                        <li><strong>Resolución:</strong> 1080x1920 (Vertical 9:16)</li>
                        <li><strong>Duración máxima:</strong> 30 segundos</li>
                        <li><strong>Framerate:</strong> 30 FPS</li>
                        <li><strong>Formato:</strong> MP4 (H.264)</li>
                        <li><strong>Fecha límite de carga:</strong> 05 de Junio, 2026 (23:59 VET)</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                Este es un correo automático, por favor no respondas a este mensaje.<br>
                Copa Santa 3D 2026 &copy; Centauro ADS
            </div>
        </div>
    </body>
    </html>
    `;

    return EmailService.send({
        to: email,
        subject: 'Copa 2026: Inscripción Confirmada y Token de Carga',
        html: htmlContent
    });
}
