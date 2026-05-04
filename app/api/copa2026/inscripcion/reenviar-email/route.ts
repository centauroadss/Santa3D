import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmailConfirmacion } from '@/lib/copa2026/emails/email1-confirmacion';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
        }

        // Buscar la inscripción más reciente para este email
        const inscripcion = await prisma.inscripcionCopa2026.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' },
            include: { pago: true }
        });

        if (!inscripcion || !inscripcion.pago) {
            return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 });
        }

        // Reenviar email
        await sendEmailConfirmacion({
            nombre: inscripcion.nombre,
            email: inscripcion.email,
            categoria: inscripcion.categoria,
            montoBs: Number(inscripcion.pago.montoCapturadoBs),
            telefonoPago: inscripcion.pago.telefonoPago,
            tokenVideo: inscripcion.tokenVideo
        });

        return NextResponse.json({ success: true, message: 'Email reenviado' });

    } catch (error: any) {
        console.error('Error reenviando email:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
