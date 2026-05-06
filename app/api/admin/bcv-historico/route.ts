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
                tasaUsdBs: tasa.toFixed(2),
                costoUnaCategoriaBs: (tasa * costoUnaCategoria).toFixed(2),
                costoAmbasCategoriasBs: (tasa * costoAmbasCategorias).toFixed(2)
            };
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

        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`DolarAPI respondió con status: ${response.status}`);
        }

        const data = await response.json();
        const usdValue = data.promedio;
        
        if (typeof usdValue !== 'number' || isNaN(usdValue)) {
            throw new Error(`El valor extraído no es un número válido: ${JSON.stringify(data)}`);
        }

        let fechaOficial = new Date();
        if (data.fechaActualizacion) {
            fechaOficial = new Date(data.fechaActualizacion);
        }
        fechaOficial.setUTCHours(0, 0, 0, 0);

        const record = await prisma.tasaBcvHistorico.upsert({
            where: { fecha: fechaOficial },
            update: {
                tasaUsdBs: usdValue,
                fuenteUrl: 'https://ve.dolarapi.com/v1/dolares/oficial'
            },
            create: {
                fecha: fechaOficial,
                tasaUsdBs: usdValue,
                fuenteUrl: 'https://ve.dolarapi.com/v1/dolares/oficial'
            }
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
