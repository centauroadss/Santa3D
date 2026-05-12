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

        // AUTO-BACKFILL / RECALCULATE fechaValor for ALL historical records to ensure 100% precision
        // This ensures dates match the correct Venezuelan business day calendar
        for (const h of historico) {
            // H.fecha is stored in UTC. E.g. "03/05/2026 8:00 PM local" = "2026-05-04T00:00:00.000Z" UTC
            // To get local Caracas date, subtract 4 hours from the UTC time
            const localCaracasTime = new Date(h.fecha.getTime() - (4 * 60 * 60 * 1000));
            
            // Extract the local year, month, and day
            const year = localCaracasTime.getUTCFullYear();
            const month = localCaracasTime.getUTCMonth();
            const day = localCaracasTime.getUTCDate();
            
            // Create a clean date object representing the local date
            const localDate = new Date(Date.UTC(year, month, day, 0, 0, 0));
            const dayOfWeek = localDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Calculate next business day based on the local date
            let nextBusinessDay = day + 1; // Default to next day
            if (dayOfWeek === 5) { // Friday -> Monday
                nextBusinessDay = day + 3;
            } else if (dayOfWeek === 6) { // Saturday -> Monday
                nextBusinessDay = day + 2;
            }
            // For Sunday (0), next business day is Monday (day + 1), which is correctly handled by default

            // Create the proper fechaValor in UTC midnight
            const correctFechaValor = new Date(Date.UTC(year, month, nextBusinessDay, 0, 0, 0));

            // Force update if it's different from current DB value (or if we just want to ensure it's exact)
            if (!h.fechaValor || h.fechaValor.getTime() !== correctFechaValor.getTime()) {
                await prisma.tasaBcvHistorico.update({
                    where: { id: h.id },
                    data: { fechaValor: correctFechaValor }
                });
                h.fechaValor = correctFechaValor; // Update in memory
            }
        }

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
                fechaValor: h.fechaValor,
                tasaUsdBs: tasa.toFixed(4),
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
            headers: { 
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Copa2026/1.0'
            },
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

        const fechaEjecucion = new Date();
        fechaEjecucion.setUTCHours(0, 0, 0, 0);

        let fechaOficial = new Date();
        if (data.fechaActualizacion) {
            fechaOficial = new Date(data.fechaActualizacion);
        }
        
        const anio = fechaOficial.getFullYear();
        const mes = fechaOficial.getMonth();
        const dia = fechaOficial.getDate();
        const fechaValorReal = new Date(Date.UTC(anio, mes, dia, 0, 0, 0));

        const record = await prisma.tasaBcvHistorico.upsert({
            where: { fecha: fechaEjecucion },
            update: {
                fechaValor: fechaValorReal,
                tasaUsdBs: usdValue,
                fuenteUrl: 'https://ve.dolarapi.com/v1/dolares/oficial'
            },
            create: {
                fecha: fechaEjecucion,
                fechaValor: fechaValorReal,
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
