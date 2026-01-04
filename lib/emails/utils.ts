import { EmailService } from '../email-service';
export interface EmailParams {
    to: string;
    subject: string;
    html: string;
    attachments?: any[];
}
export async function sendEmail({ to, subject, html, attachments }: EmailParams): Promise<boolean> {
    const TEST_RECIPIENT = 'joaoucab@gmail.com';
    const result = await EmailService.send({
        to: TEST_RECIPIENT, // Force test recipient
        subject: `[PRUEBA] ${subject} (Original: ${to})`,
        html,
        attachments
    });
    if (!result.success) {
        console.error('Error sending email:', result.error);
        return false;
    }
    return true;
}
export async function fetchRemoteAttachment(url: string, filename: string) {
    try {
        console.log(`📡 Descargando video para adjuntar: ${filename}`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 35 * 1024 * 1024) {
            console.warn('⚠️ Video muy pesado para email (>35MB), se omite adjunto.');
            return null;
        }
        return { filename, content: buffer };
    } catch (e) {
        console.error('❌ Error descargando adjunto para email:', e);
        return null;
    }
}
