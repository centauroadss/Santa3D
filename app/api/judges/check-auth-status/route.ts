// app/api/judges/check-auth-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        const judge = await prisma.judge.findUnique({
            where: { email },
            select: {
                id: true,
                nombre: true,
                // apellido: true, // Comentado por seguridad hasta regenerar cliente (EPERM)
                email: true,
                password: true
            }
        });

        if (!judge) {
            return NextResponse.json({
                exists: false,
                message: 'El email no coincide con el suministrado para su registro como jurado.'
            });
        }

        // @ts-ignore: apellido might not exist in stale client types
        const fullName = `${judge.nombre} ${judge.apellido || ''}`.trim();

        return NextResponse.json({
            exists: true,
            hasPassword: !!judge.password,
            name: fullName
        });

    } catch (error) {
        console.error('Error checking auth status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
