import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const participantId = params.id;
    const body = await request.json();
    const { pdfBase64, email, name } = body;

    if (!pdfBase64) {
      return NextResponse.json({ success: false, error: 'Missing PDF content' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // HTML Template - "Llamativo y Alegre"
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
  .email-container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
  
  /* Header Prominente */
  .header { 
    background: linear-gradient(135deg, #FF4E50 0%, #F9D423 100%); /* Sunset Gradient for Energy */
    padding: 50px 30px; 
    text-align: center; 
    color: white;
  }
  .header-icon { font-size: 50px; margin-bottom: 10px; display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
  .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }

  /* Contenido */
  .content { padding: 40px 35px; color: #4a4a4a; text-align: left; }
  .greeting { font-size: 20px; font-weight: 700; color: #333; margin-bottom: 25px; }
  
  .text-p { font-size: 16px; line-height: 1.7; margin-bottom: 25px; color: #555; }
  
  /* Destacados */
  .highlight { color: #d66a0a; font-weight: 700; background: #fff8e1; padding: 2px 6px; border-radius: 4px; }
  .highlight-purple { color: #85439a; font-weight: 700; background: #f3e5f5; padding: 2px 6px; border-radius: 4px; }
  
  .quote-box {
    border-left: 4px solid #85439a;
    background: #fdf2ff;
    padding: 15px 20px;
    font-style: italic;
    margin: 25px 0;
    color: #666;
  }

  /* Caja del Adjunto */
  .attachment-box {
    background: #eefbfb;
    border: 2px dashed #4dd0e1;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin: 30px 0;
    cursor: pointer;
  }
  .attachment-title { color: #0097a7; font-weight: 700; font-size: 16px; display: block; margin-bottom: 5px; }
  
  /* Footer */
  .footer-sig { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
  .footer-sig-text { font-size: 18px; font-weight: 800; color: #333; margin-bottom: 5px; }
  .footer-sub { font-size: 14px; color: #d66a0a; font-weight: bold; }

  .footer-brand { background-color: #333; padding: 20px; font-size: 12px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="email-container">
    
    <!-- HEADER -->
    <div class="header">
      <span class="header-icon">🚀</span>
      <h1>Misión Cumplida</h1>
      <div style="margin-top:5px; font-size:16px;">Concurso Santa 3D Venezolano</div>
    </div>

    <!-- BODY -->
    <div class="content">
      <div class="greeting">Estimado/a ${name},</div>
      
      <p class="text-p">
        <strong>¡Gracias por haber aceptado el reto!</strong>
      </p>
      
      <p class="text-p">
        Queremos hacerte llegar tu <span class="highlight">Certificado de Participación Oficial</span> en el concurso Santa 3D Venezolano. Este documento representa mucho más que una asistencia; es la prueba de que <strong>te atreviste a competir</strong>, a mostrar tu trabajo y a medirte con otros talentos en un tiempo récord durante el cierre del 2025.
      </p>

      <div class="quote-box">
        "En Centauro ADS estamos convencidos de que la práctica y la constancia son lo que separa a los buenos de los excelentes."
      </div>
      
      <p class="text-p">
        Ver tu propuesta nos llenó de entusiasmo y nos enseñó muchísimo sobre las diferentes visiones artísticas que existen en nuestro país.
      </p>

      <p class="text-p">
        <span class="highlight-purple">¿Qué sigue ahora? Seguir mejorando.</span> Queremos que este certificado sea un impulso para que continúes perfeccionando tu técnica. Nosotros ya estamos trabajando en mejorar nuestros procesos para futuras experiencias, y esperamos sinceramente ver tu nombre en la lista de inscritos de nuestros próximos llamados. <strong>¡Queremos ver tu evolución!</strong>
      </p>
      
      <!-- ATTACHMENT AREA -->
      <div class="attachment-box">
         <span class="attachment-title">🎓 Descarga tu Certificado Adjunto</span>
         <span style="font-size:13px; color:#666; display:block; margin-top:5px;">Siéntete orgulloso/a de lo logrado.</span>
      </div>

      <div class="footer-sig">
        <div class="footer-sig-text">¡Vamos por más en este 2026!</div>
        <div class="footer-sub">El equipo de Centauro ADS<br>¡Visibilidad que conecta!</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-brand">
      Santa 3D Venezolano - 2025
    </div>
  </div>
</body>
</html>
`;

    // Safe filename
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const attachmentFilename = `Certificado_Participacion_Santa3D_${safeName}.pdf`;

    const result = await EmailService.send({
      to: email, // This is expected in the body now since we might not have ID lookup if passed data directly
      subject: '🚀 Misión Cumplida: Concurso Santa 3D Venezolano',
      html: htmlContent,
      attachments: [
        {
          filename: attachmentFilename,
          content: pdfBuffer,
          type: 'application/pdf'
        }
      ]
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email Sent' });

  } catch (error: any) {
    console.error('Error sending certificate email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
