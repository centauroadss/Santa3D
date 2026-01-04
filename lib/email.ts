import { StorageService } from './storage';
import { EmailService } from './email-service';
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
  attachments?: any[];
}
async function sendEmail({ to, subject, html, attachments }: EmailParams): Promise<boolean> {
  // FORCE TEST RECIPIENT FOR SAFETY
  const TEST_RECIPIENT = 'joaoucab@gmail.com';
  console.log(`📧 Sending email to ${TEST_RECIPIENT} (Subject: ${subject})`);
  const result = await EmailService.send({
    to: TEST_RECIPIENT,
    subject: subject,
    html,
    attachments
  });
  if (!result.success) {
    console.error('❌ Failed to send email:', result.error);
    return false;
  }
  console.log('✅ Email sent successfully.');
  return true;
}
export async function sendRegistrationEmail(email: string, nombre: string): Promise<boolean> {
  const html = `<!DOCTYPE html><html><body><h1>Registro</h1><p>Hola ${nombre}</p></body></html>`;
  return await sendEmail({ to: email, subject: 'Registro Santa 3D', html });
}
export async function sendCertificateEmail(
  email: string,
  data: {
    nombre: string;
    apellido?: string;
    fileName: string;
    fileSize: string;
    submittedAt: string;
    participantId?: string;
    videoUrl?: string;
    instagram?: string;
    videoBuffer?: any;
    technicalStats?: any;
    metadata?: { width: number; height: number; duration: number; fps: number; resolution: string; };
  }
): Promise<boolean> {
  const attachments: any[] = [];
  if (data.videoBuffer) {
    attachments.push({ filename: data.fileName, content: data.videoBuffer });
  } else if (data.videoUrl) {
    const vid = await fetchRemoteAttachment(data.videoUrl, data.fileName);
    if (vid) attachments.push(vid);
  }
  // Stats Table Logic
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
                <td style="padding: 5px; border-bottom: 1px solid #eee; color: ${color(isDurOk)}; font-weight: bold;">${val(m.duration.toFixed(1))}s</td>
            </tr>
            <tr>
                <td style="padding: 5px;">FPS</td>
                <td style="padding: 5px;">30 fps</td>
                <td style="padding: 5px; color: ${color(isFpsOk)}; font-weight: bold;">~${val(m.fps)}</td>
            </tr>
        </table>
        <p style="font-size: 11px; color: #777; margin-top: 10px; font-style: italic;">* La resolución, duración y los fps estaban especificados en el brief del concurso que descargaste.</p>
    </div>
  ` : '';
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
          .message { margin-bottom: 30px; text-align: center; font-size: 16px; }
          .details-box { background-color: #f0f0f0; border-radius: 6px; padding: 20px; margin-bottom: 30px; border: 1px solid #e0e0e0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; font-size: 14px; }
          .label { font-weight: bold; color: #555; }
          .value { font-family: monospace; color: #000; }
          .steps-section { margin-top: 30px; border-top: 2px solid #eee; padding-top: 20px; }
          .step-card { background: #fffbe6; border-left: 4px solid #f79131; padding: 15px; margin-bottom: 15px; }
          .step-title { font-weight: bold; color: #d48806; margin-bottom: 5px; display: block; }
          .btn-insta { display: block; width: 200px; margin: 20px auto; background: #85439a; color: white; text-align: center; padding: 12px; border-radius: 50px; text-decoration: none; font-weight: bold; }
          .footer { background: #333; color: #aaa; text-align: center; padding: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="content">
                <h1>🎄 Constancia de Participación</h1>
                <div class="message">Hola <strong>${data.nombre}</strong>,<br>¡Tu video ha sido recibido!<br></div>
                <div class="details-box">
                    <div class="detail-row"><span class="label">Archivo:</span> <span class="value">${data.fileName}</span></div>
                    <div class="detail-row"><span class="label">Participante:</span> <span class="value">${data.nombre} ${data.apellido || ''}</span></div>
                    <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 13px; color: #555;">
                        <p>✅ El concursante aceptó los términos.</p>
                        <p>✅ Aceptó seguir a <strong>@centauroads</strong>.</p>
                    </div>
                </div>
                ${specsTable}
                <div class="steps-section">
                    <h2 style="text-align: center; color: #f79131;">🚀 Siguientes Pasos</h2>
                    <div class="step-card"><span class="step-title">1️⃣ Publícalo</span>Sube tu video y menciona a <strong>@centauroads</strong>.</div>
                    <div class="step-card" style="border-left-color: #85439a; background: #f3e5f5;"><span class="step-title">2️⃣ Consigue Likes</span>Comparte tu publicación.</div>
                </div>
                <a href="https://instagram.com/centauroads" class="btn-insta">Ir a Instagram</a>
            </div>
               <div class="footer">ID: ${data.participantId || '-'}</div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({ to: email, subject: '🎅 Certificado de Recepción - Santa 3D', html, attachments });
}
export async function sendJudgeWelcomeEmail(email: string, nombre: string, apellido: string) {
  const attachments: any[] = [];
  try {
    const fs = await import('fs');
    const path = await import('path');
    const publicDir = path.join(process.cwd(), 'public');
    
    console.log('📂 Preparing Judge Email Attachments from:', publicDir);
    const filesToAttach = [
      'Criterios_Evaluacion_Santa3D.png',
      'infografia-guia-jueces.png'
    ];
    filesToAttach.forEach(file => {
      try {
          const filePath = path.join(publicDir, file);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            attachments.push({ filename: file, content: content });
            console.log(`✅ Attached: ${file}`);
          } else {
            console.warn(`⚠️ Missing: ${file} in ${publicDir}`);
          }
      } catch (innerErr) {
          console.error(`❌ Error reading ${file}:`, innerErr);
      }
    });
  } catch (e) {
    console.error('❌ FATAL: Could not load fs/path for attachments:', e);
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
          .btn-login { display: inline-block; background-color: #85439a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: 800; margin-top: 10px; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
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
                <div style="text-align: center; margin-top: 40px; margin-bottom: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                    <p style="margin-bottom: 15px; font-weight: bold; color: #555;">Para iniciar tu votación presiona el siguiente botón:</p>
                    <a href="http://167.172.217.151/jueces/login" class="btn-login">Votación Jueces</a>
                </div>
            </div>
            <div class="footer">Concurso Santa 3D Venezolano 2025<br>Coordinación Técnica</div>
        </div>
      </body>
    </html>
  `;
  return await sendEmail({ to: email, subject: 'Bienvenida Oficial - Panel de Jueces Santa 3D', html, attachments });
}
export async function sendPasswordResetEmail(email: string, nameOrToken: string, password?: string) {
  const html = `<h1>Reset Password</h1><p>Hola ${nameOrToken}, tu nueva clave es ${password || 'Token'}</p>`;
  return await sendEmail({ to: email, subject: 'Restablecer Clave', html });
}
export async function sendVideoReceivedEmail() { return true; }
export async function sendVideoRejectedEmail() { return true; }
