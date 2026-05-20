export function wrapWithCentauroTemplate(htmlContent: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://copa2026.centauroads.com';
    const logoUrl = `${baseUrl}/centauro-logo.png`;

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; color: #111827; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 150px; margin-bottom: 20px; }
            .content { font-size: 15px; line-height: 1.6; color: #374151; }
            .details-box { background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 25px 0; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            .details-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
            .details-label { color: #6b7280; }
            .details-value { font-weight: bold; color: #111827; }
            .button-container { text-align: center; margin: 35px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #FF3366 0%, #FF9933 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; }
            .specs { background-color: #fffbeb; padding: 20px; border-radius: 8px; font-size: 14px; color: #4b5563; border-left: 4px solid #FF9933; }
            .specs ul { margin-top: 10px; padding-left: 20px; }
            .specs li { margin-bottom: 6px; }
            .footer { text-align: center; margin-top: 40px; font-size: 13px; color: #6b7280; line-height: 1.5; border-top: 1px solid #e5e7eb; padding-top: 20px;}
            .footer a { color: #FF3366; text-decoration: none; }
            
            /* Utils applied directly in html */
            .text-center { text-align: center; }
            .text-xl { font-size: 20px; }
            .font-bold { font-weight: bold; }
            .text-brand { color: #FF3366; }
            .text-gray-400 { color: #6b7280; }
            .text-white { color: #111827; } /* Remapped for light mode */
            .mt-4 { margin-top: 16px; }
            .mb-4 { margin-bottom: 16px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUrl}" alt="Centauro ADS" class="logo" />
            </div>
            
            <div class="content">
                ${htmlContent}
            </div>
            
            <div class="footer">
                ¿Tienes alguna duda sobre el concurso?<br>
                📧 <a href="mailto:mercadeo@centauroads.com">mercadeo@centauroads.com</a><br>
                ¡somos @centauroads...visibilidad que conecta!<br><br>
                <span style="font-size: 11px; color: #9ca3af;">Este es un correo automático, por favor no respondas a este mensaje.<br>
                Copa Santa 3D 2026 &copy; Centauro ADS</span>
            </div>
        </div>
    </body>
    </html>
    `;
}
