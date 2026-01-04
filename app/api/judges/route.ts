import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { sendJudgeWelcomeEmail } from '@/lib/emails/judge-welcome';
export const dynamic = 'force-dynamic';
// GET: Listar todos los jueces (Protegido para JUDGE y ADMIN)
export async function GET(request: NextRequest) {
    console.log('🔵 [API] GET /api/judges - Iniciando');
    try {
        const user = await authenticateRequest(request);
        // AUTORIZACIÓN SIMPLIFICADA
        const role = user?.role?.toUpperCase();
        console.log('🔵 [API] User Role:', role);
        if (!user || (!['JUDGE', 'ADMIN', 'ADMINISTRADOR'].includes(role || ''))) {
            console.warn('🔴 [API] Acceso denegado. Rol:', role);
            return NextResponse.json({ error: 'Unauthorized', received_role: role }, { status: 401 });
        }
        const judges = await prisma.judge.findMany({
            orderBy: { createdAt: 'asc' }
        });
        // Ocultar passwords
        const safeJudges = judges.map(j => {
            const { password, ...rest } = j;
            return rest;
        });
        return NextResponse.json({ success: true, data: safeJudges });
    } catch (error) {
        console.error('🔴 [API] GET Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
// POST: Crear juez (Mantener lógica existente de creación)
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json();
        // Crear Juez
        const newJudge = await prisma.judge.create({
            data: {
                nombre: body.nombre,
                apellido: body.apellido,
                email: body.email,
                profesion: body.profesion,
                biografia: body.biografia,
                telefono: body.telefono,
                instagram: body.instagram,
                fotoUrl: body.fotoUrl,
            }
        });
        // Enviar Email en SEGUNDO PLANO (Fire and Forget)
        sendJudgeWelcomeEmail(newJudge.email, newJudge.nombre, newJudge.apellido || '')
            .catch(e => console.error('Error enviando email bienvenida (background):', e));
        const { password, ...judgeData } = newJudge;
        return NextResponse.json({ success: true, data: judgeData });
    } catch (error: any) {
        console.error('POST Error:', error);
        // Manejar duplicados (Lógica traida de Producción)
        if (error.code === 'P2002') {
            return NextResponse.json({ success: false, error: 'Ese correo ya está registrado.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Creation failed' }, { status: 500 });
    }
}
