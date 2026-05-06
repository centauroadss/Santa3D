import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Este endpoint recibe los webhooks desde Resend
export async function POST(req: Request) {
    try {
        const payload = await req.json();
        
        // Estructura esperada por Resend Webhooks:
        // { type: "email.delivered", data: { email_id: "re_...", to: [...] } }
        
        if (!payload || !payload.type || !payload.data || !payload.data.email_id) {
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }

        const emailId = payload.data.email_id;
        const type = payload.type;

        // Buscar el log en la base de datos
        const log = await prisma.emailLog.findUnique({
            where: { resendId: emailId }
        });

        if (!log) {
            console.log(`[Resend Webhook] EmailLog no encontrado para ID: ${emailId}`);
            // Retornamos 200 de todas formas para que Resend no reintente
            return NextResponse.json({ success: true, note: 'Log not found' }, { status: 200 });
        }

        // Actualizar estados basados en el tipo de evento
        if (type === 'email.delivered') {
            await prisma.emailLog.update({
                where: { resendId: emailId },
                data: {
                    status: 'ENTREGADO',
                    deliveredAt: new Date()
                }
            });
            console.log(`[Resend Webhook] Correo marcado como ENTREGADO: ${emailId}`);
        } else if (type === 'email.opened') {
            await prisma.emailLog.update({
                where: { resendId: emailId },
                data: {
                    status: 'LEIDO',
                    openedAt: new Date()
                }
            });
            console.log(`[Resend Webhook] Correo marcado como LEIDO: ${emailId}`);
        } else if (type === 'email.bounced') {
            await prisma.emailLog.update({
                where: { resendId: emailId },
                data: {
                    status: 'REBOTADO'
                }
            });
            console.log(`[Resend Webhook] Correo marcado como REBOTADO: ${emailId}`);
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('[Resend Webhook] Error interno:', error);
        return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
    }
}
