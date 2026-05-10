import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const inscripcionId = parseInt(params.id, 10);
        if (isNaN(inscripcionId)) {
            return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
        }

        // Delete cascade using Prisma transaction
        await prisma.$transaction([
            prisma.videoCopa2026.deleteMany({ where: { inscripcionId } }),
            prisma.pagoMovil.deleteMany({ where: { inscripcionId } }),
            prisma.inscripcionCopa2026.delete({ where: { id: inscripcionId } })
        ]);

        return NextResponse.json({ success: true, message: 'Inscripción eliminada correctamente' });
    } catch (error: any) {
        console.error('Error deleting inscripción:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
