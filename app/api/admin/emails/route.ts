import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todas las plantillas
export async function GET() {
    try {
        const plantillas = await prisma.plantillaEmail.findMany({
            orderBy: { tipo: 'asc' }
        });
        return NextResponse.json(plantillas);
    } catch (error) {
        console.error('Error fetching plantillas:', error);
        return NextResponse.json({ error: 'Error al obtener plantillas' }, { status: 500 });
    }
}

// Crear nueva plantilla
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { tipo, asunto, contenidoHtml } = body;

        if (!tipo || !asunto || !contenidoHtml) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const nuevaPlantilla = await prisma.plantillaEmail.create({
            data: {
                tipo: tipo.toUpperCase(),
                asunto,
                contenidoHtml
            }
        });

        return NextResponse.json(nuevaPlantilla);
    } catch (error: any) {
        console.error('Error creating plantilla:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya existe una plantilla con ese tipo' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error al crear plantilla' }, { status: 500 });
    }
}

// Actualizar plantilla existente
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, tipo, asunto, contenidoHtml } = body;

        if (!id || !tipo || !asunto || !contenidoHtml) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const plantillaActualizada = await prisma.plantillaEmail.update({
            where: { id: Number(id) },
            data: {
                tipo: tipo.toUpperCase(),
                asunto,
                contenidoHtml
            }
        });

        return NextResponse.json(plantillaActualizada);
    } catch (error: any) {
        console.error('Error updating plantilla:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya existe una plantilla con ese tipo' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error al actualizar plantilla' }, { status: 500 });
    }
}

// Eliminar plantilla
export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        await prisma.plantillaEmail.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting plantilla:', error);
        return NextResponse.json({ error: 'Error al eliminar plantilla' }, { status: 500 });
    }
}
