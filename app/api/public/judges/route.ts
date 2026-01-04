import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        // Solo necesitamos datos públicos
        const judges = await prisma.judge.findMany({
            select: {
                id: true,
                nombre: true,
                apellido: true,
                profesion: true,
                biografia: true,
                fotoUrl: true,
                instagram: true,
            },
            take: 5, // "Los datos a mostrar seran desde el numero 1 hasta el cinco"
            orderBy: {
                createdAt: 'asc' // Orden de registro/lista
            }
        });
        return NextResponse.json({ success: true, data: judges });
    } catch (error) {
        console.error('Error fetching public judges:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
