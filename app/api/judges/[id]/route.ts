import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// PUT: Actualizar Juez
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Validar que sea el mismo juez o un admin (si hubiera rol admin explícito)
        // Por ahora confiamos en que los jueces pueden editar su perfil o el de otros según el requerimiento de "Tabla"
        // Pero idealmente solo editarse a sí mismo o si es superusuario.
        // Dado el requerimiento "Los registros se podran modificar", asumimos permisos abiertos entre jueces para este panel simple.

        const updatedJudge = await prisma.judge.update({
            where: { id: params.id },
            data: {
                nombre: body.nombre,
                apellido: body.apellido,
                profesion: body.profesion,
                biografia: body.biografia,
                email: body.email,
                telefono: body.telefono,
                instagram: body.instagram,
                fotoUrl: body.fotoUrl,
            }
        });

        return NextResponse.json({ success: true, data: updatedJudge });

    } catch (error) {
        console.error('Error updating judge:', error);
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }
}

// DELETE: Eliminar Juez
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Evitar que se elimine a sí mismo si es el último? O validación simple.

        await prisma.judge.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting judge:', error);
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
}
