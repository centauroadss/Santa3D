import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

// Initialize Providers
let resend: Resend | null = null;
const resendKey = process.env.RESEND_API_KEY;

if (!resendKey) {
    console.error('❌ [EmailService] CRITICAL: RESEND_API_KEY is missing from env vars');
} else {
    resend = new Resend(resendKey);
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    tipo?: string; // e.g., 'BIENVENIDA_JUEZ', 'CERTIFICADO', 'REGISTRO_VIDEO'
    attachments?: {
        content: string | Buffer;
        filename: string;
        type?: string;
        disposition?: string;
        content_id?: string;
    }[];
}

export const EmailService = {
    send: async ({ to, subject, html, tipo = 'GENERAL', attachments }: EmailOptions) => {
        console.log(`[EmailService] ⚡ SOLICITUD DE ENVÍO DETECTADA a: ${to}`);
        
        if (!resend) {
            console.error('❌ [EmailService] Resend no está inicializado (Falta API Key).');
            return { success: false, error: 'Missing API Key' };
        }

        try {
            const data = await resend.emails.send({
                from: 'mercadeo@centauroads.com',
                to: to,
                bcc: 'mercadeo@gmail.com', // CCO requerido por el cliente
                subject: subject,
                html,
                attachments: attachments?.map(att => ({
                    filename: att.filename,
                    content: att.content,
                })),
            });

            if (data.error) {
                console.error('❌ [EmailService] API Error:', data.error);
                return { success: false, error: data.error };
            }

            console.log('✅ [EmailService] ENVÍO EXITOSO (ID):', data.data?.id);
            
            // Guardar en la base de datos para tracking de lectura/entrega
            try {
                await prisma.emailLog.create({
                    data: {
                        resendId: data.data?.id,
                        to: to,
                        subject: subject,
                        tipo: tipo,
                        status: 'ENVIADO'
                    }
                });
            } catch (dbError) {
                console.error('❌ [EmailService] Error guardando log en BD:', dbError);
            }

            return { success: true };
        } catch (error: any) {
            console.error('❌ [EmailService] EXCEPCIÓN:', error);
            return { success: false, error: error.message };
        }
    }
};

