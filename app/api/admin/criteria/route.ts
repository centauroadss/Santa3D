
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-edge';

// GET: Listar todos los criterios
export async function GET(request: NextRequest) {
    try {
        // Permitir acceso a ADMIN y JUDGE (para el panel de evaluación)
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const criteria = await prisma.evaluationCriterion.findMany({
            orderBy: { orden: 'asc' }
        });

        return NextResponse.json({ success: true, data: criteria });

    } catch (error) {
        console.error('Error fetching criteria:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch criteria' }, { status: 500 });
    }
}

// POST: Crear nuevo criterio (Solo ADMIN)
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 401 });
        }

        const body = await request.json();

        // Validaciones básicas
        if (!body.nombre || body.peso === undefined) {
            return NextResponse.json({ error: 'Faltan campos requeridos (nombre, peso)' }, { status: 400 });
        }

        const newCriterion = await prisma.evaluationCriterion.create({
            data: {
                nombre: body.nombre,
                descripcion: body.descripcion || '',
                peso: parseFloat(body.peso),
                // Asumimos puntajeMaximo por defecto 20.0 o lo pasamos si viene
                puntajeMaximo: body.puntajeMaximo ? parseFloat(body.puntajeMaximo) : 20.0,
                orden: body.orden || 99
            }
        });

        return NextResponse.json({ success: true, data: newCriterion });

    } catch (error) {
        console.error('Error creating criterion:', error);
        return NextResponse.json({ success: false, error: 'Failed to create criterion' }, { status: 500 });
    }
}
