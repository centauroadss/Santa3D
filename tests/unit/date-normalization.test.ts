import { describe, it, expect } from 'vitest';
import { caracasToday } from '@/lib/copa2026/bcv-sync';
import { DateTime } from 'luxon';

describe('toCaracasDate', () => {
  it('un pago a las 23:00 Caracas del 12/05 NO se promueve a 13/05', () => {
    // 12/05/2026 23:00 Caracas = 13/05/2026 03:00 UTC
    const raw = DateTime.fromObject(
      { year: 2026, month: 5, day: 12, hour: 23 },
      { zone: 'America/Caracas' }
    ).toJSDate();

    const norm = caracasToday(raw);
    const dt = DateTime.fromJSDate(norm).setZone('America/Caracas');
    expect(dt.day).toBe(12);
    expect(dt.month).toBe(5);
    expect(dt.year).toBe(2026);
    expect(dt.hour).toBe(0);
  });

  it('un pago a las 01:00 Caracas del 13/05 sí queda en 13/05', () => {
    const raw = DateTime.fromObject(
      { year: 2026, month: 5, day: 13, hour: 1 },
      { zone: 'America/Caracas' }
    ).toJSDate();
    const dt = DateTime.fromJSDate(caracasToday(raw)).setZone('America/Caracas');
    expect(dt.day).toBe(13);
  });

  it('acepta string ISO', () => {
    const dt = DateTime.fromJSDate(caracasToday(new Date('2026-05-12T15:30:00Z')))
                       .setZone('America/Caracas');
    expect(dt.day).toBe(12);
  });
});
