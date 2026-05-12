import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Simple protection so not anyone can trigger it randomly, though it's idempotent
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'copa2026-cron'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[BCV API] Iniciando extracción usando DolarAPI...');
    
    // Using ve.dolarapi.com which provides a clean JSON API for the official BCV rate
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Copa2026/1.0'
      },
      // Short timeout to avoid hanging the route
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`DolarAPI respondió con status: ${response.status}`);
    }

    const data = await response.json();
    
    // data.promedio contains the official rate
    const usdValue = data.promedio;
    
    if (typeof usdValue !== 'number' || isNaN(usdValue)) {
      throw new Error(`El valor extraído no es un número válido: ${JSON.stringify(data)}`);
    }

    // EXTRAER LA "FECHA VALOR"
    let fechaOficial = new Date();
    if (data.fechaActualizacion) {
      fechaOficial = new Date(data.fechaActualizacion);
    }
    
    // Fecha Ejecucion = "Hoy" (cuando corre el scraper, típicamente la tarde del día anterior a la fecha valor)
    const fechaEjecucion = new Date();
    fechaEjecucion.setUTCHours(0, 0, 0, 0);

    // Fecha Valor = El día para el cual es válida la tasa
    // Extraemos año, mes, día exacto en base local/utc de la fecha que provee el API y forzamos medianoche
    const anio = fechaOficial.getFullYear();
    const mes = fechaOficial.getMonth();
    const dia = fechaOficial.getDate();
    const fechaValorReal = new Date(Date.UTC(anio, mes, dia, 0, 0, 0));

    console.log(`[BCV API] Tasa USD: ${usdValue} | Fecha Ejecución: ${fechaEjecucion.toISOString()} | Fecha Valor: ${fechaValorReal.toISOString()}`);

    const record = await prisma.tasaBcvHistorico.upsert({
      where: {
        fecha: fechaEjecucion
      },
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

    console.log('[BCV API] Registro guardado:', record);

    return NextResponse.json({
      success: true,
      data: record
    });

  } catch (error: any) {
    console.error('[BCV API] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
