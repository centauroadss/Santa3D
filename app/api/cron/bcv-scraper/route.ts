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

    console.log(`[BCV Scraper] Tasa USD extraída: ${usdValue}`);

    // Insertar o actualizar para el día de hoy
    // Usamos el inicio del día (medianoche) como fecha única
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const record = await prisma.tasaBcvHistorico.upsert({
      where: {
        fecha: hoy
      },
      update: {
        tasaUsdBs: usdValue,
        fuenteUrl: 'https://www.bcv.org.ve/'
      },
      create: {
        fecha: hoy,
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
