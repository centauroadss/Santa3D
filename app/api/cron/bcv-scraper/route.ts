import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Simple protection so not anyone can trigger it randomly, though it's idempotent
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'copa2026-cron'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[BCV Scraper] Iniciando extracción...');
    
    // BCV website is notoriously slow and sometimes blocks standard axios User-Agents
    const response = await axios.get('https://www.bcv.org.ve/', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const usdText = $('#dolar strong').text().trim();
    
    if (!usdText) {
      throw new Error('No se pudo extraer el texto del div #dolar strong');
    }

    // El BCV usa coma para decimales (ej. 36,1234)
    const usdValue = parseFloat(usdText.replace(',', '.'));
    
    if (isNaN(usdValue)) {
      throw new Error(`El valor extraído no es un número válido: ${usdText}`);
    }

    // EXTRAER LA "FECHA VALOR" OFICIAL DEL BCV
    // La fecha está en un span con clase date-display-single, ej: Lunes, 04 Mayo 2026
    const fechaText = $('.date-display-single').text().trim();
    const contentAttr = $('.date-display-single').attr('content'); // ej: "2026-05-04T00:00:00-04:00"
    
    let fechaOficial = new Date(); // Fallback
    
    if (contentAttr) {
        fechaOficial = new Date(contentAttr);
    } else if (fechaText) {
        // Fallback: parsear "Lunes, 04 Mayo 2026"
        // (Simplificado, idealmente contentAttr siempre existe)
    }
    
    // Forzamos la hora a medianoche UTC para mantener consistencia en la BD
    fechaOficial.setUTCHours(0, 0, 0, 0);

    console.log(`[BCV Scraper] Tasa USD: ${usdValue} | Fecha Valor: ${fechaOficial.toISOString()}`);

    const record = await prisma.tasaBcvHistorico.upsert({
      where: {
        fecha: fechaOficial
      },
      update: {
        tasaUsdBs: usdValue,
        fuenteUrl: 'https://www.bcv.org.ve/'
      },
      create: {
        fecha: fechaOficial,
        tasaUsdBs: usdValue,
        fuenteUrl: 'https://www.bcv.org.ve/'
      }
    });

    console.log('[BCV Scraper] Registro guardado:', record);

    return NextResponse.json({
      success: true,
      data: record
    });

  } catch (error: any) {
    console.error('[BCV Scraper] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
