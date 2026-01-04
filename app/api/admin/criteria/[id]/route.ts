
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-edge';

// PUT: Actualizar criterio
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
        }

        const body = await request.json();

        const updatedCriterion = await prisma.evaluationCriterion.update({
            where: { id: params.id },
            data: {
                nombre: body.nombre,
                descripcion: body.descripcion,
                peso: body.peso !== undefined ? parseFloat(body.peso) : undefined,
                puntajeMaximo: body.puntajeMaximo !== undefined ? parseFloat(body.puntajeMaximo) : undefined,
                orden: body.orden !== undefined ? parseInt(body.orden) : undefined
            }
        });

        return NextResponse.json({ success: true, data: updatedCriterion });

    } catch (error) {
        console.error('Error updating criterion:', error);
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}

// DELETE: Eliminar criterio
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
        }

        await prisma.evaluationCriterion.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting criterion:', error);
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
}
