import { PrismaClient } from '@prisma/client';

// Use the global prisma instance to avoid exhausting connections in Next.js
import { prisma } from '../prisma';

export async function getTasaDelDia(): Promise<number> {
    try {
        const hoyCaracas = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }));
        hoyCaracas.setHours(0, 0, 0, 0);

        // 1. Check if we already have today's rate in the database
        const ultimaTasa = await prisma.tasaBcvHistorico.findFirst({
            where: { fecha: { lte: hoyCaracas } },
            orderBy: { fecha: 'desc' }
        });

        if (ultimaTasa && ultimaTasa.fecha.getTime() === hoyCaracas.getTime()) {
            console.log('[BCV API] Tasa de hoy encontrada en BD. Retornando instantáneamente.');
            return Number(ultimaTasa.tasaUsdBs);
        }

        console.log('[BCV API] Tasa de hoy no encontrada. Extrayendo en tiempo real (Scraper Activo)...');

        let usdValue: number | null = null;
        let fuenteUrl = '';
        let fechaVigencia = hoyCaracas;

        // API 1: DolarAPI (Highly reliable JSON endpoint for official BCV rate)
        try {
            const res1 = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
                signal: AbortSignal.timeout(8000),
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            if (res1.ok) {
                const data = await res1.json();
                if (data.promedio && !isNaN(data.promedio)) {
                    usdValue = data.promedio;
                    fuenteUrl = 'https://ve.dolarapi.com/v1/dolares/oficial';
                    
                    // Extraer la fecha oficial de vigencia reportada por el BCV
                    if (data.fechaActualizacion) {
                        const parsedDate = new Date(data.fechaActualizacion);
                        parsedDate.setUTCHours(0, 0, 0, 0);
                        fechaVigencia = parsedDate;
                    }
                    console.log(`[BCV API] Obtenido exitosamente de DolarAPI: ${usdValue}. Fecha Vigencia: ${fechaVigencia.toISOString()}`);
                }
            }
        } catch (e: any) {
            console.warn('[BCV API] DolarAPI falló:', e.message);
        }

        // ALTERNATIVA 2: Web Scraping directo al BCV mediante Proxy (AllOrigins)
        if (!usdValue) {
            console.log('[BCV API] Intentando Alternativa 2: Scraping directo a bcv.org.ve...');
            try {
                const res2 = await fetch('https://api.allorigins.win/get?url=https://www.bcv.org.ve/', {
                    signal: AbortSignal.timeout(10000),
                    cache: 'no-store'
                });
                if (res2.ok) {
                    const data = await res2.json();
                    if (data && data.contents) {
                        const match = data.contents.match(/<div id="dolar">[\s\S]*?<strong>(.*?)<\/strong>/i);
                        if (match && match[1]) {
                            const valStr = match[1].trim().replace(',', '.');
                            const parsedVal = parseFloat(valStr);
                            if (!isNaN(parsedVal)) {
                                usdValue = parsedVal;
                                fuenteUrl = 'https://www.bcv.org.ve (vía proxy)';
                                fechaVigencia = hoyCaracas;
                                console.log(`[BCV API] Obtenido exitosamente mediante Scraping Proxy: ${usdValue}`);
                            }
                        }
                    }
                }
            } catch (e: any) {
                console.warn('[BCV API] Scraping directo falló:', e.message);
            }
        }

        // 3. Save to database for future fast requests using the exact fechaVigencia
        if (usdValue) {
             await prisma.tasaBcvHistorico.upsert({
                 where: { fecha: fechaVigencia },
                 update: { tasaUsdBs: usdValue, fuenteUrl },
                 create: { fecha: fechaVigencia, tasaUsdBs: usdValue, fuenteUrl }
             });
             
             // Si la tasa extraída es PARA MAÑANA, significa que hoyCaracas no está en la base de datos.
             // Pero la función getTasaDelDia() está diseñada para retornar la tasa de HOY.
             // Así que, después de guardar, debemos verificar qué retornamos al cliente.
             
             if (fechaVigencia.getTime() > hoyCaracas.getTime()) {
                 // Si la API devolvió la tasa de mañana, retornamos la última tasa vigente (hasta que den las 12 AM)
                 if (ultimaTasa) {
                     console.log(`[BCV API] La API devolvió la tasa de mañana (${fechaVigencia.toISOString()}). Retornando la tasa de hoy (${ultimaTasa.fecha.toISOString()}) para el usuario.`);
                     return Number(ultimaTasa.tasaUsdBs);
                 }
             }

             return Number(usdValue);
        }

        // 4. Fallback: If APIs fail, use the last known rate from the DB
        if (ultimaTasa) {
            console.warn(`[BCV API] Todas las APIs fallaron. Usando tasa antigua del ${ultimaTasa.fecha.toISOString()} como respaldo.`);
            return Number(ultimaTasa.tasaUsdBs);
        }

        throw new Error('Servicios del BCV caídos y no hay datos históricos en la base de datos.');
    } catch (error) {
        console.error('Error crítico obteniendo tasa del BCV:', error);
        throw error;
    }
}
