
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, hashPassword } from '@/lib/auth';

export async function PUT(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, password } = body;

        const updateData: any = { email };
        if (password) {
            updateData.password = await hashPassword(password);
        }

        await prisma.admin.update({
            where: { id: user.id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            message: 'Perfil actualizado correctamente'
        });



    } catch (error: any) {
        console.error('Error updating admin profile:', error);

        // Handle Unique Constraint Violation (P2002)
        if (error.code === 'P2002') {
            return NextResponse.json({
                success: false,
                error: 'Este correo electrónico ya está en uso por otro administrador.'
            }, { status: 409 }); // Conflict
        }

        return NextResponse.json({
            success: false,
            error: error.message || 'Error al actualizar el perfil'
        }, { status: 500 });
    }
}
