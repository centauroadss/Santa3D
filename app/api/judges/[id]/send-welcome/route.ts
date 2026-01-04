import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { sendJudgeWelcomeEmail } from '@/lib/emails/judge-welcome';
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 1. Authentication (Admin Only)
        const user = await authenticateRequest(request);
        const role = user?.role?.toUpperCase();
        
        if (!user || (!['ADMIN', 'ADMINISTRADOR'].includes(role || ''))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const judgeId = params.id;
        // 2. Fetch Judge
        const judge = await prisma.judge.findUnique({
            where: { id: judgeId }
        });
        if (!judge) {
            return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
        }
        // 3. Send Email
        console.log(`🔵 Manually triggering welcome email for judge: ${judge.email}`);
        await sendJudgeWelcomeEmail(judge.email, judge.nombre, judge.apellido || '');
        return NextResponse.json({ 
            success: true, 
            message: `Correo de bienvenida enviado a ${judge.email}` 
        });
    } catch (error: any) {
        console.error('Error sending welcome email:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
