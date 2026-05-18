import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Providers
let resend: Resend | null = null;
const resendKey = process.env.RESEND_API_KEY;
if (resendKey) {
    resend = new Resend(resendKey);
}

// Nodemailer transport
let transporter: nodemailer.Transporter | null = null;
if (process.env.EMAIL_PROVIDER === 'smtp') {
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS?.replace(/'/g, ''), // Limpiar comillas si las hay
        }
    });
}

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
        
        let messageId: string | undefined;
        let finalStatus = 'ENVIADO';
        let errorDetalle = null;

        try {
            if (process.env.EMAIL_PROVIDER === 'smtp' && transporter) {
                console.log('📧 Usando Nodemailer (SMTP)...');
                const info = await transporter.sendMail({
                    from: process.env.SMTP_FROM_EMAIL || 'mercadeo@centauroads.com',
                    to: to,
                    bcc: 'mercadeo@centauroads.com',
                    subject: subject,
                    html: html,
                    attachments: attachments?.map(att => ({
                        filename: att.filename,
                        content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content, 'base64'),
                        contentType: att.type
                    }))
                });
                messageId = info.messageId;
            } else if (resend) {
                console.log('📧 Usando Resend...');
                const resendFrom = process.env.RESEND_FROM_EMAIL || 'mercadeo@centauroads.com';
                const resendData = await resend.emails.send({
                    from: resendFrom,
                    to: to,
                    bcc: 'mercadeo@centauroads.com',
                    subject: subject,
                    html,
                    attachments: attachments?.map(att => ({
                        filename: att.filename,
                        content: att.content,
                    })),
                });

                if (resendData.error) {
                    console.error('❌ [EmailService] API Error:', resendData.error);
                    finalStatus = 'ERROR';
                    errorDetalle = typeof resendData.error === 'string' ? resendData.error : JSON.stringify(resendData.error);
                } else {
                    messageId = resendData.data?.id;
                }
            } else {
                console.error('❌ [EmailService] No hay proveedor de correo configurado.');
                finalStatus = 'ERROR';
                errorDetalle = 'No email provider configured';
            }

            if (finalStatus === 'ENVIADO') {
                console.log('✅ [EmailService] ENVÍO EXITOSO (ID):', messageId);
            }
            
        } catch (error: any) {
            console.error('❌ [EmailService] EXCEPCIÓN:', error);
            finalStatus = 'ERROR';
            errorDetalle = error.message;
        }

        // Guardar siempre en la base de datos para tracking de lectura/entrega o fallo
        try {
            await prisma.emailLog.create({
                data: {
                    resendId: messageId || errorDetalle?.substring(0, 190), // Guardar ID o pedazo del error
                    to: to,
                    subject: subject,
                    tipo: tipo,
                    status: finalStatus
                }
            });
        } catch (dbError) {
            console.error('❌ [EmailService] Error guardando log en BD:', dbError);
        }

        return { success: finalStatus === 'ENVIADO', error: errorDetalle };
    }
};

