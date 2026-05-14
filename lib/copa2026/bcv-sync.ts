import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';

const TZ = 'America/Caracas';
const BCV_URL = 'https://www.bcv.org.ve/';

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
};

export function parseFechaValor(html: string): DateTime {
  const m = html.match(/Fecha\s+Valor:\s*[^,]+,\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (!m) throw new Error('BCV: no se pudo parsear Fecha Valor');
  const [, d, mesTxt, y] = m;
  const mes = MESES[mesTxt.toLowerCase()];
  if (!mes) throw new Error(`BCV: mes desconocido ${mesTxt}`);
  return DateTime.fromObject(
    { year: +y, month: mes, day: +d },
    { zone: TZ }
  ).startOf('day');
}

export function parseTasaUsd(html: string): number {
  // BCV usa coma decimal: "508,60040000"
  const m = html.match(/USD[\s\S]{0,200}?([\d.]+,\d+)/);
  if (!m) throw new Error('BCV: no se pudo parsear tasa USD');
  const tasa = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(tasa) || tasa <= 0) {
    throw new Error(`BCV: tasa inválida ${m[1]}`);
  }
  return tasa;
}

export async function syncBcv(): Promise<{ fechaValor: Date; tasa: number; nuevo: boolean }> {
  const res = await fetch(BCV_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`BCV: HTTP ${res.status}`);
  const html = await res.text();

  const fechaValor = parseFechaValor(html).toJSDate();
  const tasa = parseTasaUsd(html);

  // Fecha Ejecucion = "Hoy" (cuando corre el scraper, típicamente la tarde del día anterior a la fecha valor)
  const fechaEjecucion = new Date();
  fechaEjecucion.setUTCHours(0, 0, 0, 0);

  const existente = await prisma.tasaBcvHistorico.findUnique({
    where: { fecha: fechaEjecucion }
  });

  await prisma.tasaBcvHistorico.upsert({
    where: { fecha: fechaEjecucion },
    update: { tasaUsdBs: tasa, fechaValor, fechaEjecucion: new Date() },
    create: { fecha: fechaEjecucion, fechaValor, tasaUsdBs: tasa, fechaEjecucion: new Date(), fuenteUrl: BCV_URL }
  });

  return { fechaValor, tasa, nuevo: !existente };
}
