import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const totalInscritos = await prisma.inscripcionCopa2026.count();
        const countRender = await prisma.inscripcionCopa2026.count({
            where: { categoria: { in: ['RENDER', 'AMBAS'] } }
        });
        const countIA = await prisma.inscripcionCopa2026.count({
            where: { categoria: { in: ['IA', 'AMBAS'] } }
        });

        return NextResponse.json({
            success: true,
            data: { 
                totalInscritos,
                countRender,
                countIA
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
