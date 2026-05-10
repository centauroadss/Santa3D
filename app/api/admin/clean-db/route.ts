import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.$transaction([
            prisma.videoCopa2026.deleteMany({}),
            prisma.pagoMovil.deleteMany({}),
            prisma.inscripcionCopa2026.deleteMany({})
        ]);

        return NextResponse.json({ success: true, message: 'Base de datos limpiada correctamente para pruebas.' });
    } catch (error: any) {
        console.error('Error cleaning DB:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
