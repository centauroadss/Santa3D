
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        const judge = await prisma.judge.findUnique({
            where: { email }
        });

        if (!judge) {
            // Security: Don't reveal if user exists, but for this internal app we might just warn
            return NextResponse.json({ success: true, message: 'Si el correo existe, se ha notificado al administrador.' });
        }

        // 1. Update Judge Flag
        await prisma.judge.update({
            where: { id: judge.id },
            data: { resetRequested: true }
        });

        // 2. Create Robust Audit Log
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';

        await prisma.auditLog.create({
            data: {
                action: 'RESET_REQUEST',
                severity: 'WARN',
                details: 'Solicitud de recuperación. Clave a suministrar: Centauro2025',
                targetId: judge.id,
                targetEmail: judge.email,
                targetName: `${judge.nombre} ${judge.apellido || ''}`,
                issuer: email,
                ipAddress: ip,
                userAgent: userAgent
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Solicitud enviada. El administrador te contactará con tu nueva clave.'
        });

    } catch (error: any) {
        console.error('*** ERROR IN RESET REQUEST ***', error);
        // FORCE RETURN ERROR DETAILS TO CLIENT FOR DEBUGGING
        return NextResponse.json({
            success: false,
            error: `Server Error: ${error.message || error}`,
            details: JSON.stringify(error)
        }, { status: 500 });
    }
}
