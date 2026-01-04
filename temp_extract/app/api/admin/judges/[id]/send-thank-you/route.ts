import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const judgeId = params.id;
    const contentType = request.headers.get('content-type') || '';

    // Expecting Multipart/form-data or specific JSON with base64?
    // Let's use JSON body with base64 for simplicity in Nextjs 14
    const body = await request.json();
    const { pdfBase64 } = body;

    if (!pdfBase64) {
      return NextResponse.json({ success: false, error: 'Missing PDF content' }, { status: 400 });
    }

    // Fetch Judge Info for customized email
    const judge = await prisma.judge.findUnique({ where: { id: judgeId } });
    if (!judge) {
      return NextResponse.json({ success: false, error: 'Judge not found' }, { status: 404 });
    }

    // --- HTML TEMPLATE DESIGN (Embedded) ---
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
  .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #663399 0%, #4b247a 100%); padding: 40px 20px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .content { padding: 40px 30px; color: #333333; text-align: left; }
  .content h2 { color: #663399; margin-bottom: 25px; font-size: 22px; }
  .text-p { font-size: 16px; line-height: 1.8; color: #555555; margin-bottom: 20px; }
  .highlight { color: #663399; font-weight: 600; background-color: #f3e5f5; padding: 2px 5px; border-radius: 4px; }
  .footer { background-color: #f1f1f1; padding: 20px; font-size: 13px; color: #888888; text-align: center; border-top: 1px solid #e0e0e0; }
  .btn-download { display: inline-block; background-color: #663399; color: #ffffff; padding: 12px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; margin-top: 20px; }
</style>
</head>
<body>
<div class="email-container">
    
    <!-- Header Festivo -->
    <div class="header">
      <div style="font-size: 40px; margin-bottom: 10px;">🎄✨</div>
      <h1>¡Misión Cumplida!</h1>
      <p style="color: #e0b3ff; margin-top: 10px; font-size: 16px;">Gracias por ser parte del Santa 3D</p>
    </div>

    <!-- Cuerpo del Mensaje -->
    <div class="content">
      <h2>¡Hola, ${judge.nombre}!</h2>
      
      <p class="text-p">
        ¡Lo logramos! Queremos agradecerte enormemente tu energía y dedicación como jurado en nuestro desafío <em>Santa 3D Venezolano</em>.
      </p>
      
      <p class="text-p">
        Tu apoyo fue vital para filtrar y reconocer la creatividad de los 15 participantes que dieron vida a nuestra Navidad. Valoramos muchísimo que nos hayas regalado tu tiempo y tu ojo crítico durante las últimas semanas de diciembre; sabemos el esfuerzo que eso conlleva y, sinceramente, <span class="highlight">tu aporte elevó el nivel de la competencia</span>.
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid #663399; padding: 15px; margin: 25px 0; font-style: italic; color: #555;">
        "En Centauro ADs hemos aprendido muchísimo de este proceso. Esta experiencia nos ha permitido crecer y ajustar nuestros motores para que las próximas competencias sean aún más grandes y eficientes."
      </div>
      
      <p class="text-p">
        ¡Esperamos contar nuevamente con tu talento y visión en las próximas aventuras que ya estamos planeando!
      </p>

      <div style="text-align: center; margin: 40px 0;">
         <span class="btn-download">📎 Reporte Adjunto</span>
         <p style="font-size: 12px; color: #999; margin-top: 10px;">Adjunto te compartimos el reporte final con tus evaluaciones para que tengas el registro de tu gran contribución.</p>
      </div>

      <p class="text-p" style="font-weight: bold; color: #663399; margin-top: 30px;">
        ¡Gracias por impulsar el talento venezolano con nosotros!<br>
        El equipo de Centauro ADs.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      Santa 3D Venezolano - 2025<br>
      Impulsado por Centauro ADs
    </div>
  </div>
</body>
</html>
`;
    // ---------------------------------------

    // Send Email via Service
    // Convert Base64 back to Buffer for attachment? 
    // Resend accepts base64 string directly for content in attachments usually, 
    // but let's check lib/email-service.ts interface.
    // It takes { content: string | Buffer }. Resend API supports base64 string as content if we don't convert it?
    // Actually Resend node SDK usually takes buffer.
    // Let's create a Buffer.
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const result = await EmailService.send({
      to: judge.email,
      subject: 'Agradecimiento Jurado - Santa 3D Venezolano',
      html: htmlContent,
      attachments: [
        {
          filename: `Reporte_Evaluacion_${judge.nombre}_${judge.apellido}.pdf`,
          content: pdfBuffer,
          type: 'application/pdf' // Explicit type
        }
      ]
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email Sent' });

  } catch (error: any) {
    console.error('Error sending thank you email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
