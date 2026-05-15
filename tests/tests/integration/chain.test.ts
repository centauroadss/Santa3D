/**
 * Pruebas integrales: validación de cadena FV_n = ejec_{n+1}.
 *
 * Resultado esperado:
 *   - Post-fix: 3/3 PASS
 *   - Pre-fix:  0/3 (el código actual no expone chainOk ni warnings)
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncBcv } from '@/lib/copa2026/bcv-sync';
import { fetcherDe } from '../helpers/bcv-mock';
import { caracasInstant, limpiarBcv } from '../helpers/db';

describe('Validación de cadena FV_prev === fecha_new', () => {
  beforeEach(limpiarBcv);
  afterAll(async () => {
    await limpiarBcv();
    await prisma.$disconnect();
  });

  it('cadena continua L-M-X-J-V mantiene chainOk=true en todos', async () => {
    const dias = [
      { ejec: '2026-05-11T22:00', fvDay: 12, tasa: '500,46060000' }, // Lun → Mar
      { ejec: '2026-05-12T22:00', fvDay: 13, tasa: '504,91460000' }, // Mar → Mié
      { ejec: '2026-05-13T22:00', fvDay: 14, tasa: '510,78730000' }, // Mié → Jue
      { ejec: '2026-05-14T22:00', fvDay: 15, tasa: '515,18000000' }, // Jue → Vie
    ];

    for (const d of dias) {
      const r = await syncBcv(
        caracasInstant(d.ejec),
        fetcherDe({ year: 2026, month: 5, day: d.fvDay, tasa: d.tasa })
      );
      if (!r.chainOk) {
        console.log('chainOk failed for ejec:', d.ejec, 'fvDay:', d.fvDay, 'warnings:', r.warnings);
      }
      expect(r.chainOk).toBe(true);
      expect(r.warnings).toHaveLength(0);
    }
  });

  it('salto de fin de semana V → L NO rompe la cadena', async () => {
    // Vie 08/05 publica para Lun 11/05
    const r1 = await syncBcv(
      caracasInstant('2026-05-08T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 11, tasa: '499,86080000' })
    );
    expect(r1.chainOk).toBe(true);

    // Lun 11/05 publica para Mar 12/05 — cadena OK porque prev.FV=11 === ejec.new=11
    const r2 = await syncBcv(
      caracasInstant('2026-05-11T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 12, tasa: '500,46060000' })
    );
    expect(r2.chainOk).toBe(true);
    expect(r2.warnings).toHaveLength(0);
  });

  it('cron pierde un día: chainOk=false con warning pero NO bloquea el insert', async () => {
    // Lun 11/05 publica para Mar 12/05
    await syncBcv(
      caracasInstant('2026-05-11T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 12, tasa: '504,91460000' })
    );

    // Cron del martes 12/05 FALLA — no se ejecuta.
    // Miércoles 13/05 corre y BCV publica para jueves 14/05.
    const r = await syncBcv(
      caracasInstant('2026-05-13T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 14, tasa: '510,78730000' })
    );

    expect(r.chainOk).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]).toMatch(/Cadena rota/);
    expect(r.nuevo).toBe(true);

    const filas = await prisma.tasaBcvHistorico.count();
    expect(filas).toBe(2);
  });
});
