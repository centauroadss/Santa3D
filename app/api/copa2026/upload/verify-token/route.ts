import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
        }

        const inscripcion = await prisma.inscripcionCopa2026.findUnique({
            where: { tokenVideo: token },
            include: {
                videos: true
            }
        });

        if (!inscripcion) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        if (inscripcion.tokenExpiry && new Date() > inscripcion.tokenExpiry) {
            return NextResponse.json({ error: 'El plazo de carga de videos ha vencido.' }, { status: 410 });
        }

        if (inscripcion.estatusToken === 'USADO' || inscripcion.estatusInscripcion === 'COMPLETADO') {
            return NextResponse.json({
                success: true,
                isLoaded: true,
                participante: {
                    nombre: inscripcion.nombre,
                    apellido: inscripcion.apellido,
                    categoria: inscripcion.categoria,
                },
                videos: inscripcion.videos
            }, { status: 200 });
        }

        return NextResponse.json({
            success: true,
            isLoaded: false,
            participante: {
                nombre: inscripcion.nombre,
                apellido: inscripcion.apellido,
                categoria: inscripcion.categoria,
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error verifying token:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
