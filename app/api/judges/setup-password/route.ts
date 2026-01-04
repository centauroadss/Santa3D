// app/api/judges/setup-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
        }
        const judge = await prisma.judge.findUnique({
            where: { email },
        });
        if (!judge) {
            return NextResponse.json({ error: 'Juez no encontrado' }, { status: 404 });
        }
        const hashedPassword = await hashPassword(password);
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
        // CORRECCIÓN: Inicializamos la variable explícitamente como 'any' para evitar que TS se confunda
        let updatedJudge: any = null;
        await prisma.$transaction(async (tx) => {
            updatedJudge = await tx.judge.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    isDefaultPassword: false,
                    resetRequested: false
                }
            });
            await tx.auditLog.create({
                data: {
                    action: 'PASSWORD_SETUP',
                    severity: 'INFO',
                    details: 'Usuario configuró su contraseña personalizada',
                    targetId: updatedJudge.id,
                    targetEmail: updatedJudge.email,
                    targetName: `${updatedJudge.nombre} ${updatedJudge.apellido || ''}`,
                    issuer: email,
                    ipAddress: ip,
                    userAgent: userAgent
                }
            });
        });
        if (!updatedJudge) throw new Error('Failed to update judge');
        // Auto-login (generar token)
        const token = await generateToken({
            id: updatedJudge.id,
            email: updatedJudge.email,
            role: updatedJudge.role as 'JUDGE' | 'ADMIN',
        });
        const response = NextResponse.json({
            success: true,
            data: {
                token,
                judge: {
                    id: updatedJudge.id,
                    nombre: updatedJudge.nombre,
                    email: updatedJudge.email,
                    role: updatedJudge.role,
                },
            },
        });
        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        return response;
    } catch (error) {
        console.error('Error setting password:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
