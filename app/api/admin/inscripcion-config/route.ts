import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const config = await prisma.configConcurso.findUnique({
            where: { clave: 'INSCRIPCION_CONFIG' }
        });
        
        if (config) {
            return NextResponse.json({ config: JSON.parse(config.valor) });
        }
        
        return NextResponse.json({ config: null });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching config' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { config } = await req.json();
        
        await prisma.configConcurso.upsert({
            where: { clave: 'INSCRIPCION_CONFIG' },
            update: { valor: JSON.stringify(config) },
            create: { clave: 'INSCRIPCION_CONFIG', valor: JSON.stringify(config), descripcion: 'Configuración de Costos y Categorías de Inscripción' }
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error saving config' }, { status: 500 });
    }
}
