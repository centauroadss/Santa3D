import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';
import { syncBcv } from '@/lib/copa2026/bcv-sync';

const TZ = 'America/Caracas';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const hoyCaracas = DateTime.now().setZone(TZ).startOf('day').toJSDate();

        const historico = await prisma.tasaBcvHistorico.findMany({
            orderBy: {
                fecha: 'desc'
            },
            take: 30 // Traer los últimos 30 días
        });

        // Obtener costos actuales para los cálculos
        const configs = await prisma.configConcurso.findMany({
            where: {
                clave: {
                    in: ['costo_una_categoria', 'costo_ambas_categorias']
                }
            }
        });
        const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);
        const costoUnaCategoria = parseFloat(configMap['costo_una_categoria'] || '5');
        const costoAmbasCategorias = parseFloat(configMap['costo_ambas_categorias'] || '10');

        const seenFv = new Set<string>();
        const seenFecha = new Set<string>();
        const seenTasa = new Set<string>();
        const data: any[] = [];

        historico.forEach(h => {
            const fvStr = h.fechaValor.toISOString().split('T')[0];
            const fechaStr = h.fecha.toISOString().split('T')[0];
            const tasaStr = h.tasaUsdBs.toString();

            // Solo agregamos el registro si NINGUNO de sus tres valores principales se ha visto antes.
            // Esto garantiza unicidad estricta en las tres columnas.
            if (!seenFv.has(fvStr) && !seenFecha.has(fechaStr) && !seenTasa.has(tasaStr)) {
                seenFv.add(fvStr);
                seenFecha.add(fechaStr);
                seenTasa.add(tasaStr);

                const fv = DateTime.fromJSDate(h.fechaValor).setZone(TZ).startOf('day').toJSDate();
                let estado: 'futura' | 'vigente' | 'historica';
                if (+fv > +hoyCaracas)       estado = 'futura';
                else if (+fv === +hoyCaracas) estado = 'vigente';
                else                          estado = 'historica';

                const tasa = parseFloat(h.tasaUsdBs.toString());
                data.push({
                    id: h.id,
                    fecha: h.fecha,
                    fechaEjecucion: h.fechaEjecucion,
                    fechaValor: h.fechaValor,
                    tasaUsdBs: tasa.toFixed(4),
                    costoUnaCategoriaBs: (tasa * costoUnaCategoria).toFixed(2),
                    costoAmbasCategoriasBs: (tasa * costoAmbasCategorias).toFixed(2),
                    estado
                });
            }
        });

        return NextResponse.json({ success: true, data }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const result = await syncBcv();

        // Get the updated/created record to return to the frontend
        const record = await prisma.tasaBcvHistorico.findFirst({
            where: { fechaValor: result.fechaValor },
            orderBy: { fechaEjecucion: 'desc' }
        });

        return NextResponse.json({ success: true, data: record }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
