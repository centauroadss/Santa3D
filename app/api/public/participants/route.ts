import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StorageService } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
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

        const data = await Promise.all(participants.map(async (p) => {
            let fotoUrl = null;
            if (p.fotoPerfilPath) {
                try {
                    fotoUrl = await StorageService.getUrl(p.fotoPerfilPath);
                } catch (err) {
                    console.error('Error getting image url:', err);
                }
            }

            return {
                id: p.id,
                nombreCompleto: `${p.nombre} ${p.apellido}`.trim(),
                categoria: p.categoria,
                instagram: p.instagram?.replace('@', '') || null,
                fotoUrl
            };
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
