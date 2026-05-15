/**
 * Reproducción exacta del bug observado en producción (id=11).
 *
 * fechaEjecucion = 2026-05-15T03:46:05.645Z (UTC)
 *                = 14/05/2026 23:46 Caracas
 *
 * El código actual guardaba fecha=15/05 (UTC midnight). Tras el fix debe ser
 * fecha=14/05.
 *
 * Resultado esperado:
 *   - Post-fix: 1/1 PASS
 *   - Pre-fix:  0/1 (devuelve día 15 en lugar de 14)
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';
import { syncBcv } from '@/lib/copa2026/bcv-sync';
import { fetcherDe } from '../helpers/bcv-mock';
import { limpiarBcv } from '../helpers/db';

const TZ = 'America/Caracas';

describe('Fix bug TZ — escenario real id=11', () => {
  beforeEach(limpiarBcv);
  afterAll(async () => {
    await limpiarBcv();
    await prisma.$disconnect();
  });

  it('scrape a las 23:46 Caracas del 14/05 guarda fecha=14/05, no 15/05', async () => {
    const instante = DateTime.fromISO('2026-05-15T03:46:05.645Z', {
      zone: 'utc',
    }).toJSDate();

    const r = await syncBcv(
      instante,
      fetcherDe({ year: 2026, month: 5, day: 15, tasa: '515,18000000' })
    );

    // El día Caracas debe ser 14, no 15
    const fechaDt = DateTime.fromJSDate(r.fecha).setZone(TZ);
    expect(fechaDt.day).toBe(14);
    expect(fechaDt.month).toBe(5);

    // La fechaValor sigue siendo 15/05 (BCV publica para mañana)
    const fvDt = DateTime.fromJSDate(r.fechaValor).setZone(TZ);
    expect(fvDt.day).toBe(15);

    // Verificar persistencia
    const row = await prisma.tasaBcvHistorico.findUnique({
      where: { fecha: r.fecha },
    });
    expect(row).not.toBeNull();
    expect(DateTime.fromJSDate(row!.fecha).setZone(TZ).day).toBe(14);
  });
});
