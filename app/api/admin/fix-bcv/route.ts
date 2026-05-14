import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        console.log('Iniciando reparación de historico BCV...');
        
        const historicos = await prisma.tasaBcvHistorico.findMany();
        let actualizados = 0;

        for (const h of historicos) {
            // Asignar `fecha` y `fechaEjecucion` basándose en la `fechaValor`
            // Para que no todas tengan "13/05/2026, 01:56 a. m." debido a la migración
            if (h.fechaValor) {
                // Generar una fecha lógica. Asumimos que la búsqueda se hizo el mismo día o el día anterior.
                // Usaremos la misma fechaValor a las 10:00 a.m. como valor simulado realista
                const fechaCorregida = new Date(h.fechaValor);
                fechaCorregida.setUTCHours(14, 0, 0, 0); // 10:00 AM hora de Caracas (-4)

                await prisma.tasaBcvHistorico.update({
                    where: { id: h.id },
                    data: {
                        fecha: fechaCorregida,
                        fechaEjecucion: fechaCorregida
                    }
                });
                actualizados++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Migración completada. Registros actualizados: ${actualizados}`,
            datos: await prisma.tasaBcvHistorico.findMany({
                orderBy: { fechaValor: 'desc' }
            })
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
