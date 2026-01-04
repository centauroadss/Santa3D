import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, hashPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/emails/judge-reset';
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authenticate Admin
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
        }
        const judgeId = params.id;
        const defaultPassword = 'Centauro2025!'; // Default temporary password
        const hashedPassword = await hashPassword(defaultPassword);
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
        // 1. Get Target Info for Log
        const targetJudge = await prisma.judge.findUnique({ where: { id: judgeId } });
        await prisma.$transaction(async (tx) => {
            // Update password & flags
            await tx.judge.update({
                where: { id: judgeId },
                data: {
                    password: hashedPassword,
                    isDefaultPassword: true,
                    resetRequested: false // Clear request flag
                }
            });
            // Log robust action
            await tx.auditLog.create({
                data: {
                    action: 'PASSWORD_RESET',
                    severity: 'CRITICAL',
                    details: 'Contraseña restablecida a default "Centauro2025!"',
                    targetId: judgeId,
                    targetEmail: targetJudge?.email || 'unknown',
                    targetName: `${targetJudge?.nombre} ${targetJudge?.apellido || ''} `,
                    issuer: user.email,
                    ipAddress: ip,
                    userAgent: userAgent
                }
            });
        });
        // 2. Send Email Notification with New Password
        if (targetJudge && targetJudge.email) {
            try {
                await sendPasswordResetEmail(
                    targetJudge.email,
                    targetJudge.nombre,
                    defaultPassword
                );
            } catch (emailError) {
                console.error('Failed to send reset email:', emailError);
                // We don't fail the request if email fails, but we log it
            }
        }
        return NextResponse.json({
            success: true,
            message: `Contraseña restablecida a "${defaultPassword}" y notificada por correo.`,
            newPassword: defaultPassword
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ success: false, error: 'Reset failed' }, { status: 500 });
    }
}
