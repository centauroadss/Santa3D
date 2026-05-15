/**
 * Pruebas del cálculo del día Caracas.
 * Valida el FIX del bug #1 (TZ).
 *
 * Resultado esperado:
 *   - Post-fix: 3/3 PASS
 *   - Pre-fix:  0/3 (el código actual usa setUTCHours(0,0,0,0))
 */

import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { caracasToday } from '@/lib/copa2026/bcv-sync';

const TZ = 'America/Caracas';

describe('caracasToday — FIX del bug TZ', () => {
  it('a las 23:46 hora Caracas del 14/05, devuelve 14/05 (no 15/05)', () => {
    // Este es el caso real observado en BD id=11.
    // fechaEjecucion = 2026-05-15T03:46:05.645Z → en Caracas son las 23:46 del 14/05.
    const instante = DateTime.fromISO('2026-05-15T03:46:05.645Z', {
      zone: 'utc',
    }).toJSDate();

    const fecha = caracasToday(instante);
    const dt = DateTime.fromJSDate(fecha).setZone(TZ);
    expect(dt.day).toBe(14);
    expect(dt.month).toBe(5);
    expect(dt.year).toBe(2026);
    expect(dt.hour).toBe(0);
    expect(dt.minute).toBe(0);
  });

  it('a las 00:30 hora Caracas del 15/05, devuelve 15/05', () => {
    const instante = DateTime.fromISO('2026-05-15T04:30:00Z', {
      zone: 'utc',
    }).toJSDate();
    const dt = DateTime.fromJSDate(caracasToday(instante)).setZone(TZ);
    expect(dt.day).toBe(15);
    expect(dt.month).toBe(5);
  });

  it('a las 12:00 mediodía Caracas, devuelve el mismo día', () => {
    const instante = DateTime.fromObject(
      { year: 2026, month: 5, day: 14, hour: 12 },
      { zone: TZ }
    ).toJSDate();
    const dt = DateTime.fromJSDate(caracasToday(instante)).setZone(TZ);
    expect(dt.day).toBe(14);
    expect(dt.hour).toBe(0);
  });
});
