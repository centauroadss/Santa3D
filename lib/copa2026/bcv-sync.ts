/**
 * Scraper BCV — Concurso Santa 3D Venezolano
 *
 * Responsabilidades:
 *  1. Obtener HTML de bcv.org.ve con reintentos y timeout.
 *  2. Parsear "Fecha Valor" y "USD" del HTML.
 *  3. Insertar/actualizar en `tasa_bcv_historico` respetando:
 *     - fecha (día Caracas, no UTC)            → UNIQUE
 *     - fechaValor (de la página BCV)          → UNIQUE
 *     - tasaUsdBs                              → UNIQUE
 *     - Cadena: prev.fechaValor === fecha_new
 *
 * Reemplaza completamente al archivo previo.
 */

import { DateTime } from 'luxon';
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { prisma } from '@/lib/prisma';

// ─── Constantes ─────────────────────────────────────────────────────────────
export const TZ = 'America/Caracas';
export const BCV_URL = 'https://www.bcv.org.ve/';
export const MAX_RETRIES = 5;
export const BASE_BACKOFF_MS = 2000;
export const HTTP_TIMEOUT_MS = 15000;
export const MIN_HTML_LENGTH = 1000;

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

// ─── Parsers (puros, fáciles de testear) ────────────────────────────────────

export function parseFechaValor(html: string): DateTime {
  const m = html.match(
    /Fecha\s+Valor:\s*[^,]+,\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i
  );
  if (!m) throw new Error('BCV: no se pudo parsear Fecha Valor');
  const [, d, mesTxt, y] = m;
  const mes = MESES[mesTxt.toLowerCase()];
  if (!mes) throw new Error(`BCV: mes desconocido ${mesTxt}`);
  return DateTime.fromObject(
    { year: +y, month: mes, day: +d },
    { zone: 'utc' }
  ).startOf('day');
}

export function parseTasaUsd(html: string): number {
  const m = html.match(/USD[\s\S]{0,200}?([\d.]+,\d+)/);
  if (!m) throw new Error('BCV: no se pudo parsear tasa USD');
  const tasa = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(tasa) || tasa <= 0) {
    throw new Error(`BCV: tasa inválida ${m[1]}`);
  }
  return tasa;
}

// ─── Cálculo de "hoy" en Caracas (★ FIX bug TZ) ─────────────────────────────

/**
 * Devuelve la medianoche del día Caracas correspondiente al instante dado.
 * Reemplaza el bug `new Date().setUTCHours(0,0,0,0)` que devolvía el día UTC.
 */
export function caracasToday(now: Date = new Date()): Date {
  const dt = DateTime.fromJSDate(now).setZone(TZ);
  return new Date(Date.UTC(dt.year, dt.month - 1, dt.day));
}

// ─── HTTP con reintentos (★ FIX scraping frágil) ────────────────────────────

const defaultAxios: AxiosInstance = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }), // BCV usa cert auto-firmado
  timeout: HTTP_TIMEOUT_MS,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Santa3D-Validator/1.0)',
  },
  validateStatus: (s) => s === 200,
});

export interface HttpClient {
  get: (url: string, config?: any) => Promise<{ status: number; data: any }>;
}

export async function fetchBcvHtml(
  retries: number = MAX_RETRIES,
  client: HttpClient = defaultAxios
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await client.get(BCV_URL);
      if (
        res.status === 200 &&
        typeof res.data === 'string' &&
        res.data.length >= MIN_HTML_LENGTH
      ) {
        return res.data;
      }
      lastErr = new Error(
        `BCV: cuerpo vacío o muy corto (${
          typeof res.data === 'string' ? res.data.length : 'N/A'
        })`
      );
    } catch (e) {
      lastErr = e;
    }
    if (attempt < retries) {
      const wait = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error(
    `BCV: falló tras ${retries} intentos: ${(lastErr as Error)?.message}`
  );
}

// ─── Resultado del sync ─────────────────────────────────────────────────────

export interface SyncResult {
  fecha?: Date;
  fechaValor?: Date;
  tasa?: number;
  nuevo?: boolean;
  chainOk?: boolean;
  warnings?: string[];
  skipped?: boolean;
}

// ─── Función principal ──────────────────────────────────────────────────────

/**
 * Ejecuta el sync con BCV. Inyectables `now` y `bcvFetcher` para tests.
 */
export async function syncBcv(
  now: Date = new Date(),
  bcvFetcher: () => Promise<string> = () => fetchBcvHtml()
): Promise<SyncResult> {
  const html = await bcvFetcher();
  const fechaValor = parseFechaValor(html).toJSDate();
  const tasa = parseTasaUsd(html);
  const fecha = caracasToday(now);
  const warnings: string[] = [];

  // ★ Regla R1: fechaValor >= fecha
  if (fechaValor.getTime() < fecha.getTime()) {
    return { skipped: true };
  }

  // ★ Verificar si ya existe la fechaValor
  const existenteFV = await prisma.tasaBcvHistorico.findFirst({
    where: { fechaValor },
  });

  if (existenteFV) {
    const tasaExistente = parseFloat(existenteFV.tasaUsdBs.toString());
    if (tasaExistente === tasa) {
      warnings.push(
        `BCV no ha actualizado: fechaValor=${fechaValor.toISOString().slice(0, 10)} ya registrada. Omitiendo.`
      );
      return { skipped: true, warnings };
    } else {
      throw new Error(
        `BCV: anomalía. fechaValor=${fechaValor.toISOString().slice(0, 10)} ya existe con tasa ${tasaExistente} != ${tasa}`
      );
    }
  }

  // ★ Validar cadena FV_prev === fecha_new
  const prev = await prisma.tasaBcvHistorico.findFirst({
    where: { fecha: { lt: fecha } },
    orderBy: { fecha: 'desc' },
  });
  const chainOk = !prev || +prev.fechaValor === +fecha;
  if (!chainOk && prev) {
    warnings.push(
      `Cadena rota: prev.fechaValor=${prev.fechaValor
        .toISOString()
        .slice(0, 10)} != fecha=${fecha
        .toISOString()
        .slice(0, 10)}. Hay un gap (¿feriado o cron caído?).`
    );
  }

  const existente = await prisma.tasaBcvHistorico.findUnique({
    where: { fecha },
  });

  await prisma.tasaBcvHistorico.upsert({
    where: { fecha },
    update: {
      tasaUsdBs: tasa,
      fechaValor,
      fechaEjecucion: new Date(),
    },
    create: {
      fecha,
      fechaValor,
      tasaUsdBs: tasa,
      fechaEjecucion: new Date(),
      fuenteUrl: BCV_URL,
    },
  });

  return {
    fecha,
    fechaValor,
    tasa,
    nuevo: !existente,
    chainOk,
    warnings,
  };
}
