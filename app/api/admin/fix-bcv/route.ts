import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Iniciando inyección de historico BCV faltante...');
        
        const fecha = new Date('2026-05-19T00:00:00.000Z');
        const fechaValor = new Date('2026-05-20T00:00:00.000Z');
        const tasaUsdBs = 520.9142;

        const result = await prisma.tasaBcvHistorico.upsert({
            where: { fecha },
            update: {
                fechaValor,
                tasaUsdBs,
                fuenteUrl: 'MANUAL_INJECT',
            },
            create: {
                fecha,
                fechaValor,
                tasaUsdBs,
                fuenteUrl: 'MANUAL_INJECT',
                fechaEjecucion: new Date()
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Registro inyectado correctamente.`,
            record: result
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
