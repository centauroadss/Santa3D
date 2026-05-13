import { PrismaClient } from '@prisma/client';

// Use the global prisma instance to avoid exhausting connections in Next.js
import { prisma } from '../prisma';

export async function getTasaDelDia(): Promise<number> {
    try {
        const hoyCaracas = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }));
        hoyCaracas.setHours(0, 0, 0, 0);

        // 1. Check if we already have today's rate in the database
        const ultimaTasa = await prisma.tasaBcvHistorico.findFirst({
            orderBy: { fechaValor: 'desc' }
        });

        if (ultimaTasa && ultimaTasa.fechaValor && ultimaTasa.fechaValor.getTime() >= hoyCaracas.getTime()) {
            console.log('[BCV API] Tasa de hoy o posterior encontrada en BD. Retornando instantáneamente.');
            return Number(ultimaTasa.tasaUsdBs);
        }

        console.log('[BCV API] Tasa actualizada no encontrada. Extrayendo en tiempo real (Scraper Activo)...');

        let usdValue: number | null = null;
        let fuenteUrl = '';
        let fechaVigencia = hoyCaracas;
        const fechaEjecucion = hoyCaracas;

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
                        // Asegurarnos de tener la fecha UTC correcta
                        const anio = parsedDate.getFullYear();
                        const mes = parsedDate.getMonth();
                        const dia = parsedDate.getDate();
                        fechaVigencia = new Date(Date.UTC(anio, mes, dia, 0, 0, 0));
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
                        const match = data.contents.match(/<div id="dolar">[\s\S]*?<strong[^>]*>(.*?)<\/strong>/i);
                        if (match && match[1]) {
                            const valStr = match[1].trim().replace(',', '.');
                            const parsedVal = parseFloat(valStr);
                            if (!isNaN(parsedVal)) {
                                usdValue = parsedVal;
                                fuenteUrl = 'https://www.bcv.org.ve (vía proxy)';
                                
                                const matchDate = data.contents.match(/Fecha Valor:.*?content="([^"]+)"/is);
                                if (matchDate && matchDate[1]) {
                                    fechaVigencia = new Date(matchDate[1]);
                                } else {
                                    console.warn('[BCV API] No se pudo extraer la Fecha Valor del HTML, usando fecha actual + 1.');
                                    fechaVigencia = new Date(Date.UTC(hoyCaracas.getFullYear(), hoyCaracas.getMonth(), hoyCaracas.getDate() + 1, 0, 0, 0)); // Asumimos día hábil siguiente
                                }
                                
                                console.log(`[BCV API] Obtenido exitosamente mediante Scraping Proxy: ${usdValue}. Fecha Vigencia: ${fechaVigencia.toISOString()}`);
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
                 where: { fecha: fechaEjecucion },
                 update: { fechaValor: fechaVigencia, tasaUsdBs: usdValue, fuenteUrl },
                 create: { fecha: fechaEjecucion, fechaValor: fechaVigencia, tasaUsdBs: usdValue, fuenteUrl }
             });
             
             return Number(usdValue);
        }

        // 4. Fallback: If APIs fail, use the last known rate from the DB
        if (ultimaTasa) {
            console.warn(`[BCV API] Todas las APIs fallaron. Usando tasa antigua como respaldo.`);
            return Number(ultimaTasa.tasaUsdBs);
        }

        throw new Error('Servicios del BCV caídos y no hay datos históricos en la base de datos.');
    } catch (error) {
        console.error('Error crítico obteniendo tasa del BCV:', error);
        throw error;
    }
}
