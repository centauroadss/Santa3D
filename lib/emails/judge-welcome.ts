import { sendEmail } from './utils';
import fs from 'fs';
import path from 'path';
export async function sendJudgeWelcomeEmail(email: string, nombre: string, apellido: string) {
    // 1. Prepare Attachments (Robust Mode)
    const attachments: any[] = [];
    const publicDir = path.join(process.cwd(), 'public');
    
    // List of files to attach
    const files = [
        'Criterios_Evaluacion_Santa3D.png',
        'infografia-guia-jueces.png'
    ];
    console.log('--- Preparing Judge Email Attachments ---');
    for (const file of files) {
        try {
            const filePath = path.join(publicDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath);
                attachments.push({
                    filename: file,
                    content: content
                });
                console.log(`✅ Attached: ${file}`);
            } else {
                console.warn(`⚠️ File not found: ${file}`);
            }
        } catch (err) {
            console.error(`❌ Error reading ${file}:`, err);
        }
    }
    // 2. Build HTML Content
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
          .emoji-icon { font-size: 18px; margin-right: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="header">
               <div style="font-size: 30px; color: white; font-weight: bold;">SANTA 3D 2025</div>
            </div>
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
                <div style="text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 25px;">
                  <a href="http://167.172.217.151/jueces/login" 
                     style="background-color: #85439a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                     Votación Jueces
                  </a>
                </div>
            </div>
            <div class="footer">
                Concurso Santa 3D Venezolano 2025<br>
                Coordinación Técnica
            </div>
        </div>
      </body>
    </html>
  `;
    // 3. Send Email (Copied exactly from contestant.ts logic)
    console.log(`Sending Judge Welcome Email to ${email} with ${attachments.length} attachments...`);
    
    return await sendEmail({
        to: email,
        subject: 'Bienvenida Oficial - Panel de Jueces Santa 3D',
        html,
        attachments
    });
}
