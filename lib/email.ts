import { StorageService } from './storage';
import { EmailService } from './email-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/*
  CRITICAL: EMAIL CONTENT
  1. Rich HTML Template with Technical Stats.
  2. Legal Text included.
  3. Attachments strictly handled.
*/
async function fetchRemoteAttachment(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 35 * 1024 * 1024) return null;
    return { filename, content: buffer };
  } catch (e) {
    console.error('Error remote attachment:', e);
    return null;
  }
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  tipo?: string;
  attachments?: any[];
}

async function sendEmail({ to, subject, html, tipo, attachments }: EmailParams): Promise<boolean> {
  const result = await EmailService.send({
    to: to,
    subject: subject,
    html,
    tipo,
    attachments
  });
  if (!result.success) {
    console.error('❌ Failed to send email:', result.error);
    return false;
  }
  console.log('✅ Email sent successfully.');
  return true;
}

// ==========================================
// 1. REGISTRO DE VIDEO / INSCRIPCION
// ==========================================
export async function sendConcursanteRegistroEmail(
  email: string,
  data: {
    nombre: string;
    apellido?: string;
    fileName: string;
    technicalStats?: any;
    metadata?: { width: number; height: number; duration: number; fps: number; resolution: string; };
  }
): Promise<boolean> {
  const attachments: any[] = [];
  
  // Buscar URL de adjunto en configuración
  const config = await prisma.configConcurso.findUnique({ where: { clave: 'url_adjunto_registro_video' } });
  if (config?.valor) {
    const att = await fetchRemoteAttachment(config.valor, 'Instrucciones_Concursante.pdf');
    if (att) attachments.push(att);
  }

  let m = data.metadata;
  if (!m && data.technicalStats) m = { width: 0, height: 0, fps: 0, duration: 0, resolution: data.technicalStats.resolution || 'N/A' };
  
  const isResOk = m ? (m.width === 1024 && m.height === 1792) : false;
  const isDurOk = m ? (m.duration >= 15 && m.duration <= 20) : false;
  const isFpsOk = m ? (m.fps >= 30) : false;
  const color = (ok: boolean) => ok ? '#28a745' : '#dc3545';
  const val = (v: any) => v || '-';
  const specsTable = m ? `
    <div style="margin-bottom: 20px; border: 1px solid #ddd; background: #f9f9f9; padding: 10px; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #555;">📋 Reporte Técnico del Video</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr style="background: #e9ecef; color: #333;">
                <th style="padding: 5px; text-align: left;">Dato</th>
                <th style="padding: 5px; text-align: left;">Esperado</th>
                <th style="padding: 5px; text-align: left;">Recibido</th>
            </tr>
            <tr>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">Resolución</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">1024x1792</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; color: ${color(isResOk)}; font-weight: bold;">${val(m.resolution)}</td>
            </tr>
            <tr>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">Duración</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">15s - 20s</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; color: ${color(isDurOk)}; font-weight: bold;">${val(m.duration?.toFixed(1))}s</td>
            </tr>
            <tr>
                <td style="padding: 5px;">FPS</td>
                <td style="padding: 5px;">30 fps</td>
                <td style="padding: 5px; color: ${color(isFpsOk)}; font-weight: bold;">~${val(m.fps)}</td>
            </tr>
        </table>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .content { padding: 40px; }
          h1 { color: #85439a; font-size: 22px; margin-bottom: 20px; text-align: center; }
          .message { margin-bottom: 30px; text-align: center; font-size: 16px; }
          .details-box { background-color: #f0f0f0; border-radius: 6px; padding: 20px; margin-bottom: 30px; border: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="content">
                <h1>🎉 ¡Felicidades, tu video ha sido recibido!</h1>
                <div class="message">Hola <strong>${data.nombre}</strong>,<br>Tu video ha sido validado técnicamente. Ahora eres un concursante oficial.<br>Recuerda que debes hacer entrega definitiva de tu video hasta la fecha límite del concurso.</div>
                
                <div class="details-box">
                    <div style="font-size: 14px; margin-bottom: 10px;"><strong>Archivo recibido:</strong> ${data.fileName}</div>
                </div>
                ${specsTable}
                <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #555;">
                  ¡Éxito en la competencia!<br>El equipo de Centauro ADS
                </div>
            </div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({ to: email, subject: 'Registro Exitoso - Santa 3D', html, tipo: 'REGISTRO_VIDEO', attachments });
}

// ==========================================
// 2. CERTIFICADO DE PARTICIPACION
// ==========================================
export async function sendCertificateEmail(
  email: string,
  nombre: string
): Promise<boolean> {
  const attachments: any[] = [];
  
  const config = await prisma.configConcurso.findUnique({ where: { clave: 'url_adjunto_certificado' } });
  if (config?.valor) {
    const att = await fetchRemoteAttachment(config.valor, 'Certificado_Participacion.pdf');
    if (att) attachments.push(att);
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background-color: #f79131; padding: 25px; text-align: center; color: white; font-size: 24px; font-weight: bold; }
          .content { padding: 40px; }
          .message { margin-bottom: 20px; font-size: 16px; line-height: 1.6; }
          .quote { font-style: italic; background: #f9f9f9; border-left: 4px solid #85439a; padding: 15px; margin: 20px 0; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="header">🚀 Misión Cumplida<br><span style="font-size: 16px; font-weight: normal;">Concurso Santa 3D Venezolano</span></div>
            <div class="content">
                <div class="message">
                    Estimado/a <strong>${nombre}</strong>,<br><br>
                    <strong>¡Gracias por haber aceptado el reto!</strong><br><br>
                    Queremos hacerte llegar tu Certificado de Participación Oficial en el concurso Santa 3D Venezolano. Este documento representa mucho más que una asistencia; es la prueba de que te atreviste a competir, a mostrar tu trabajo y a medirte con otros talentos en un tiempo récord durante el cierre del 2025.
                </div>
                <div class="quote">
                    "En Centauro ADS estamos convencidos de que la práctica y la constancia son lo que separa a los buenos de los excelentes."
                </div>
                <div class="message">
                    Ver tu propuesta nos llenó de entusiasmo y nos enseñó muchísimo sobre las diferentes visiones artísticas que existen en nuestro país.<br><br>
                    <strong>¿Qué sigue ahora? Seguir mejorando.</strong> Queremos que este certificado sea un impulso para que continúes perfeccionando tu técnica. Nosotros ya estamos trabajando en mejorar nuestros procesos para futuras experiencias, y esperamos sinceramente ver tu nombre en la lista de inscritos de nuestros próximos llamados. ¡Queremos ver tu evolución!<br><br>
                    <strong>🎓 Descarga tu Certificado Adjunto</strong><br>
                    Siéntete orgulloso/a de lo logrado.<br><br>
                    ¡Vamos por más en este 2026!<br>
                    El equipo de Centauro ADS<br>
                    ¡Visibilidad que conecta!
                </div>
            </div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({ to: email, subject: 'Misión Cumplida: Concurso Santa 3D Venezolano', html, tipo: 'CERTIFICADO', attachments });
}

// ==========================================
// 3. BIENVENIDA A JUECES
// ==========================================
export async function sendJudgeWelcomeEmail(email: string, nombre: string, apellido: string) {
  const attachments: any[] = [];
  
  const config = await prisma.configConcurso.findUnique({ where: { clave: 'url_adjunto_bienvenida_juez' } });
  if (config?.valor) {
    const att = await fetchRemoteAttachment(config.valor, 'Guia_Evaluacion_Jueces.pdf');
    if (att) attachments.push(att);
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background-color: #85439a; padding: 25px; text-align: center; }
          .content { padding: 40px; }
          h1 { color: #85439a; font-size: 22px; margin-bottom: 20px; text-align: center; }
          .message { margin-bottom: 30px; font-size: 16px; line-height: 1.6; }
          .details-box { background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-bottom: 20px; border: 1px solid #e0e0e0; }
          .section-title { font-weight: bold; color: #85439a; margin-top: 25px; margin-bottom: 10px; display: block; font-size: 18px; border-bottom: 2px solid #f79131; padding-bottom: 5px; }
          .bullet-list { margin: 0; padding-left: 20px; }
          .bullet-list li { margin-bottom: 8px; }
          .footer { background: #333; color: #aaa; text-align: center; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="header"><div style="font-size: 30px; color: white; font-weight: bold;">SANTA 3D 2025</div></div>
            <div class="content">
                <h1>Bienvenida Oficial <br> Panel de Jueces</h1>
                <div class="message">
                    Estimado(a) <strong>${nombre} ${apellido}</strong>,<br><br>
                    Gracias por formar parte de nuestra mesa técnica de evaluación. A continuación le presentamos su Hoja de Ruta y credenciales de acceso.
                </div>
                <div class="details-box">
                    <h3 style="margin-top:0; color: #555;">🔒 Credenciales y Seguridad</h3>
                    <p><strong>User ID:</strong> ${email} (Su identificador único)</p>
                    <p><strong>Contraseña:</strong> El sistema le solicitará crear su propia contraseña segura al ingresar por primera vez.</p>
                    <p style="font-size: 13px; color: #666; font-style: italic;">* Confidencialidad: Todo el contenido visualizado es material protegido. Su acceso es personal e intransferible.</p>
                </div>
                <div class="section-title">🗺️ Su Ruta de Evaluación</div>
                <p>Hemos preparado esta guía visual para orientar su experiencia en la plataforma:</p>
                <p><strong>Guía de Evaluación de Jueces</strong> (Ver Adjunto)</p>
                <h3 style="color: #d48806; margin-bottom: 5px;">📂 Carpeta "Pendientes"</h3>
                <p style="margin-top: 0;">Su punto de partida. Aquí encontrará únicamente los videos que esperan por su calificación.</p>
                <h3 style="color: #d48806; margin-bottom: 5px;">⭐ Interfaz de Evaluación</h3>
                <p style="margin-top: 0;">Reproduzca el video y califique los 5 criterios (0-20 pts cada uno):</p>
                <ul class="bullet-list">
                    <li>Creatividad y Originalidad (20%)</li>
                    <li>Calidad Técnica 3D (30%)</li>
                    <li>Impacto Visual (20%)</li>
                    <li>Identidad Venezolana (20%)</li>
                    <li>Narrativa / Storytelling (10%)</li>
                </ul>
                <p>El sistema calculará el promedio ponderado automáticamente.</p>
                <h3 style="color: #d48806; margin-bottom: 5px;">📝 Carpeta "Todos"</h3>
                <p style="margin-top: 0;">Su archivo histórico. Contiene tanto los pendientes como los ya calificados. Use esta sección si necesita Re-evaluar (Editar) algún puntaje anterior.</p>
                <h3 style="color: #d48806; margin-bottom: 5px;">📊 Grilla de Control</h3>
                <p style="margin-top: 0;">En la vista de lista, podrá ver rápidamente el estado de cada video y su puntaje asignado.</p>
            </div>
            <div class="footer">Concurso Santa 3D Venezolano 2025<br>Coordinación Técnica</div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({ to: email, subject: 'Bienvenida Oficial - Panel de Jueces Santa 3D', html, tipo: 'BIENVENIDA_JUEZ', attachments });
}

// ==========================================
// 4. AGRADECIMIENTO A JUECES
// ==========================================
export async function sendJudgeThankYouEmail(email: string, nombre: string) {
  const attachments: any[] = [];
  
  const config = await prisma.configConcurso.findUnique({ where: { clave: 'url_adjunto_agradecimiento_juez' } });
  if (config?.valor) {
    const att = await fetchRemoteAttachment(config.valor, 'Reporte_Final_Santa3D.pdf');
    if (att) attachments.push(att);
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .content { padding: 40px; }
          .message { margin-bottom: 20px; font-size: 16px; line-height: 1.6; }
          .highlight { background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0; color: #85439a; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="content">
                <div style="font-size: 24px; text-align: center; margin-bottom: 20px;">🎄✨<br>¡Gracias, ${nombre}!</div>
                <h2 style="text-align: center; color: #333; margin-top: 0;">Un cierre de año increíble para el talento venezolano</h2>
                
                <div class="message">
                    Estimado, <strong>${nombre}</strong>!<br><br>
                    ¡Lo logramos! Queremos agradecerte enormemente tu energía y dedicación como jurado en nuestro desafío Santa 3D Venezolano.<br><br>
                    Tu apoyo fue vital para filtrar y reconocer la creatividad de los participantes que dieron vida a nuestra Navidad. Valoramos muchísimo que nos hayas brindado tu tiempo y tu ojo crítico; sabemos el esfuerzo que eso conlleva y, sinceramente, tu aporte elevó el nivel de la competencia.<br><br>
                    En Centauro ADs hemos aprendido muchísimo de este proceso. Esta experiencia nos ha permitido crecer y ajustar nuestros motores para que las próximas competencias sean aún mejores. ¡Esperamos contar nuevamente con tu talento y visión en las próximas aventuras que ya estamos planeando!
                </div>
                
                <div class="highlight">
                    📎 Reporte Final Adjunto<br>
                    <span style="font-size: 14px; font-weight: normal; color: #555;">Te compartimos el reporte final con tus evaluaciones para que tengas el registro de tu gran contribución.</span>
                </div>
                
                <div class="message" style="text-align: center; font-weight: bold; margin-top: 30px;">
                    ¡Gracias por impulsar el talento venezolano con nosotros!<br>
                    <span style="color: #85439a;">El equipo de Centauro ADS</span>
                </div>
            </div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({ to: email, subject: '¡Gracias por tu participación! - Santa 3D', html, tipo: 'AGRADECIMIENTO_JUEZ', attachments });
}

export async function sendRegistrationEmail(email: string, nombre: string): Promise<boolean> {
  const html = `<!DOCTYPE html><html><body><h1>Registro</h1><p>Hola ${nombre}</p></body></html>`;
  return await sendEmail({ to: email, subject: 'Registro Santa 3D', html, tipo: 'REGISTRO_GENERAL' });
}

export async function sendPasswordResetEmail(email: string, nameOrToken: string, password?: string) {
  const html = `<h1>Reset Password</h1><p>Hola ${nameOrToken}, tu nueva clave es ${password || 'Token'}</p>`;
  return await sendEmail({ to: email, subject: 'Restablecer Clave', html, tipo: 'RESET_PASSWORD' });
}

export async function sendVideoReceivedEmail() { return true; }
export async function sendVideoRejectedEmail() { return true; }
