import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch participants whose estatusInscripcion is not RECHAZADO (or we can just fetch COMPLETADO/APROBADO)
        // To be safe and show only active ones:
        const participants = await prisma.inscripcionCopa2026.findMany({
            where: {
                estatusInscripcion: {
                    in: ['APROBADO', 'COMPLETADO']
                }
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                categoria: true,
                instagram: true,
                fotoPerfilPath: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format data: map fotoPerfilPath to a public URL or default, sanitize names
        const data = participants.map(p => ({
            id: p.id,
            nombreCompleto: `${p.nombre} ${p.apellido}`.trim(),
            categoria: p.categoria,
            instagram: p.instagram?.replace('@', '') || null,
            fotoUrl: p.fotoPerfilPath 
                ? `/api/public/s3-image?key=${encodeURIComponent(p.fotoPerfilPath)}` 
                : null
        }));

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching public participants:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch participants' }, { status: 500 });
    }
}
