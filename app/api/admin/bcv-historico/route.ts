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

        const data = historico.map(h => {
            const tasa = parseFloat(h.tasaUsdBs.toString());
            return {
                id: h.id,
                fecha: h.fecha,
                tasaUsdBs: tasa,
                costoUnaCategoriaBs: (tasa * costoUnaCategoria).toFixed(2),
                costoAmbasCategoriasBs: (tasa * costoAmbasCategorias).toFixed(2)
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
