import { sendEmail, fetchRemoteAttachment } from './utils';
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
        const videoAttachment = await fetchRemoteAttachment(data.videoUrl, data.fileName);
        if (videoAttachment) attachments.push(videoAttachment);
    }
    let m = data.metadata;
    if (!m && data.technicalStats) {
        m = {
            width: 0, height: 0, fps: 0, duration: 0,
            resolution: data.technicalStats.resolution || 'N/A'
        };
    }
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
                <td style="padding: 5px; border-bottom: 1px solid #eee; color: ${color(isResOk)}; font-weight: bold;">
                    ${val(m.resolution)}
                </td>
            </tr>
            <tr>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">Duración</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">15s - 20s</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; color: ${color(isDurOk)}; font-weight: bold;">
                    ${val(m.duration.toFixed(1))}s
                </td>
            </tr>
            <tr>
                <td style="padding: 5px;">FPS</td>
                <td style="padding: 5px;">30 fps</td>
                <td style="padding: 5px; color: ${color(isFpsOk)}; font-weight: bold;">
                    ~${val(m.fps)}
                </td>
            </tr>
        </table>
        <p style="font-size: 11px; color: #777; margin-top: 10px; font-style: italic;">
            * La resolución, duración y los fps estaban especificados en el brief del concurso que descargaste.
        </p>
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
            <div class="header"></div>
            <div class="content">
                <h1>🎄 Constancia de Participación</h1>
                <div class="message">
                    Hola <strong>${data.nombre}</strong>,<br><br>
                    ¡Tu video ha sido recibido exitosamente!<br>
                    Aquí tienes los detalles de tu participación:
                </div>
                
                <div class="details-box">
                    <div class="detail-row"><span class="label">Archivo:</span> <span class="value">${data.fileName}</span></div>
                    <div class="detail-row"><span class="label">Tamaño:</span> <span class="value">${data.fileSize}</span></div>
                    <div class="detail-row"><span class="label">Fecha:</span> <span class="value">${data.submittedAt}</span></div>
                    <div class="detail-row"><span class="label">Participante:</span> <span class="value">${data.nombre} ${data.apellido || ''}</span></div>
                    
                    <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 13px; color: #555;">
                        <p style="margin: 2px 0;">✅ El concursante aceptó los términos y condiciones del concurso.</p>
                        <p style="margin: 2px 0;">✅ El anunciante confirmó seguir la cuenta de <strong>@centauroads</strong> en Instagram.</p>
                    </div>
                </div>
                <!-- TABLA DE SPECS TÉCNICOS -->
                ${specsTable}
                <p style="font-size: 12px; color: #888; text-align: justify;">
                    * Hemos adjuntado una copia de tu video a este correo como respaldo (si es menor a 35MB).
                </p>
                <div class="steps-section">
                    <h2 style="text-align: center; color: #f79131;">🚀 Siguientes Pasos</h2>
                    <div class="step-card">
                        <span class="step-title">1️⃣ Publícalo en Instagram</span>
                        Sube tu video (Reel/Post) y menciona a <strong>@centauroads</strong>. ¡Tu perfil debe ser público!
                    </div>
                    <div class="step-card" style="border-left-color: #85439a; background: #f3e5f5;">
                        <span class="step-title">2️⃣ Consigue Likes ❤️</span>
                        Comparte tu publicación. Los videos más votados pasarán a la ronda final.
                    </div>
                </div>
                <a href="https://instagram.com/centauroads" class="btn-insta">Ir a Instagram</a>
            </div>
            <div class="footer">
                Concurso Santa 3D Venezolano 2025<br>
                ID: ${data.participantId || '-'}
            </div>
        </div>
      </body>
    </html>
  `;
    return await sendEmail({
        to: email,
        subject: '🎅 Certificado de Recepción - Santa 3D',
        html,
        attachments
    });
}
