/**
 * Pruebas integrales: unicidad columnar.
 *
 * Requiere DATABASE_URL apuntando a una BD de tests.
 *
 * Resultado esperado:
 *   - Post-fix: 3/3 PASS
 *   - Pre-fix:  1/3 (sin la validación de conflicto en syncBcv, los duplicados
 *                    en fechaValor y tasaUsdBs se insertan sin error)
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncBcv } from '@/lib/copa2026/bcv-sync';
import { fetcherDe } from '../helpers/bcv-mock';
import { caracasInstant, limpiarBcv } from '../helpers/db';

describe('Unicidad columnar (fecha, fechaValor, tasaUsdBs)', () => {
  beforeEach(limpiarBcv);
  afterAll(async () => {
    await limpiarBcv();
    await prisma.$disconnect();
  });

  it('rechaza segundo insert con misma fechaValor', async () => {
    await syncBcv(
      caracasInstant('2026-05-12T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 13, tasa: '510,00000000' })
    );

    await expect(
      syncBcv(
        caracasInstant('2026-05-13T22:00'),
        // Misma FV (13/05), tasa distinta — debe rechazar
        fetcherDe({ year: 2026, month: 5, day: 13, tasa: '511,00000000' })
      )
    ).rejects.toThrow(/conflicto de unicidad/);

    const filas = await prisma.tasaBcvHistorico.count();
    expect(filas).toBe(1);
  });

  it('rechaza segundo insert con misma tasa', async () => {
    await syncBcv(
      caracasInstant('2026-05-12T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 13, tasa: '510,00000000' })
    );

    await expect(
      syncBcv(
        caracasInstant('2026-05-13T22:00'),
        // FV distinta, MISMA tasa — debe rechazar
        fetcherDe({ year: 2026, month: 5, day: 14, tasa: '510,00000000' })
      )
    ).rejects.toThrow(/conflicto de unicidad/);

    const filas = await prisma.tasaBcvHistorico.count();
    expect(filas).toBe(1);
  });

  it('acepta cuando las 3 columnas son nuevas', async () => {
    const r1 = await syncBcv(
      caracasInstant('2026-05-12T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 13, tasa: '510,00000000' })
    );
    expect(r1.nuevo).toBe(true);

    const r2 = await syncBcv(
      caracasInstant('2026-05-13T22:00'),
      fetcherDe({ year: 2026, month: 5, day: 14, tasa: '511,00000000' })
    );
    expect(r2.nuevo).toBe(true);
    expect(r2.chainOk).toBe(true);

    const filas = await prisma.tasaBcvHistorico.count();
    expect(filas).toBe(2);
  });
});
