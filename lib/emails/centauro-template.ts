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
            body { font-family: 'Inter', Arial, sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border: 1px solid #222; border-radius: 12px; margin-top: 40px; margin-bottom: 40px;}
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 150px; margin-bottom: 20px; }
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
            
            /* Utils applied directly in html */
            .text-center { text-align: center; }
            .text-xl { font-size: 20px; }
            .font-bold { font-weight: bold; }
            .text-brand { color: #FF3366; }
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
                Este es un correo automático, por favor no respondas a este mensaje.<br>
                Copa Santa 3D 2026 &copy; Centauro ADS
            </div>
        </div>
    </body>
    </html>
    `;
}
