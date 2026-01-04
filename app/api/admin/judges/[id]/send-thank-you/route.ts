import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const judgeId = params.id;
    const body = await request.json();
    const { pdfBase64 } = body;

    if (!pdfBase64) {
      return NextResponse.json({ success: false, error: 'Missing PDF content' }, { status: 400 });
    }

    // Fetch Judge Info
    const judge = await prisma.judge.findUnique({ where: { id: judgeId } });
    if (!judge) {
      return NextResponse.json({ success: false, error: 'Judge not found' }, { status: 404 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // --- HTML TEMPLATE (INLINE FOR SAFETY) ---
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
  .email-container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
  
  /* Header Prominente y Alegre */
  .header { 
    background: linear-gradient(135deg, #85439a 0%, #aa5cc2 50%, #f79131 100%); 
    padding: 50px 30px; 
    text-align: center; 
    color: white;
  }
  .header-icon { font-size: 48px; margin-bottom: 15px; display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
  .header h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .header-subtitle { margin-top: 10px; font-size: 18px; font-weight: 500; opacity: 0.95; }

  /* Contenido */
  .content { padding: 40px 35px; color: #4a4a4a; text-align: left; }
  .greeting { font-size: 22px; font-weight: 700; color: #85439a; margin-bottom: 25px; }
  
  .text-p { font-size: 16px; line-height: 1.7; margin-bottom: 25px; color: #555; }
  
  /* Destacados */
  .highlight { color: #85439a; font-weight: 700; background: #fdf2ff; padding: 2px 6px; border-radius: 4px; }
  .highlight-orange { color: #d66a0a; font-weight: 700; }

  /* Caja del Adjunto */
  .attachment-box {
    background: #fff8f0;
    border: 2px dashed #f79131;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin: 30px 0;
  }
  .attachment-title { color: #d66a0a; font-weight: 700; font-size: 16px; display: block; margin-bottom: 5px; }
  .attachment-desc { font-size: 14px; color: #888; margin: 0; }

  /* Footer */
  .closing { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
  .closing-text { font-size: 18px; font-weight: 700; color: #85439a; margin-bottom: 10px; }
  .signature { font-size: 16px; color: #666; }
  
  .footer { background-color: #333; padding: 20px; font-size: 12px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="email-container">
    
    <!-- HEADER -->
    <div class="header">
      <span class="header-icon">🎄✨</span>
      <h1>¡Gracias, ${judge.nombre}!</h1>
      <div class="header-subtitle">Un cierre de año increíble para el talento venezolano</div>
    </div>

    <!-- BODY -->
    <div class="content">
      <div class="greeting">Estimado, ${judge.nombre}!</div>
      
      <p class="text-p">
        <strong>¡Lo logramos!</strong> Queremos agradecerte enormemente tu energía y dedicación como jurado en nuestro desafío <span class="highlight">Santa 3D Venezolano</span>.
      </p>
      
      <p class="text-p">
        Tu apoyo fue <span class="highlight-orange">vital</span> para filtrar y reconocer la creatividad de los <strong>15 participantes</strong> que dieron vida a nuestra Navidad. Valoramos muchísimo que nos hayas brindado tu tiempo y tu ojo crítico durante las últimas semanas de diciembre; sabemos el esfuerzo que eso conlleva y, sinceramente, <span class="highlight">tu aporte elevó el nivel de la competencia</span>.
      </p>

      <p class="text-p">
        En Centauro ADs hemos aprendido muchísimo de este proceso. Esta experiencia nos ha permitido crecer y ajustar nuestros motores para que las próximas competencias sean <strong>aún mejores</strong>. ¡Esperamos contar nuevamente con tu talento y visión en las próximas aventuras que ya estamos planeando!
      </p>
      
      <!-- ATTACHMENT AREA -->
      <div class="attachment-box">
         <span class="attachment-title">📎 Reporte Final Adjunto</span>
         <p class="attachment-desc">Te compartimos el reporte final con tus evaluaciones para que tengas el registro de tu gran contribución.</p>
      </div>

      <div class="closing">
        <div class="closing-text">¡Gracias por impulsar el talento venezolano con nosotros!</div>
        <div class="signature">El equipo de Centauro ADs.</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      Santa 3D Venezolano - 2025
    </div>
  </div>
</body>
</html>
`;

    // Sanitize filename to be safe
    const safeName = `${judge.nombre}_${judge.apellido}`.replace(/[^a-zA-Z0-9]/g, '_');
    const attachmentFilename = `Reporte_Evaluaciones_Santa3D_${safeName}.pdf`;

    const result = await EmailService.send({
      to: judge.email,
      subject: `¡Gracias por tu apoyo, ${judge.nombre}! - Santa 3D`,
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
    console.error('Error sending thank you email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
