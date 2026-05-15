/**
 * E2E: simula 5 días hábiles consecutivos (L-V) y verifica que se cumplan
 * TODAS las invariantes de negocio:
 *  - 5 filas insertadas (idempotencia respetada)
 *  - Cadena perfecta: FV[i] === fecha[i+1]
 *  - Unicidad columnar en las 3 columnas
 *  - chainOk=true en cada inserción
 *
 * Resultado esperado: 1/1 PASS post-fix.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncBcv } from '@/lib/copa2026/bcv-sync';
import { fetcherDe } from '../helpers/bcv-mock';
import { caracasInstant, limpiarBcv } from '../helpers/db';

describe('E2E — 5 días hábiles consecutivos', () => {
  beforeEach(limpiarBcv);
  afterAll(async () => {
    await limpiarBcv();
    await prisma.$disconnect();
  });

  it('produce cadena perfecta L-V con unicidad columnar', async () => {
    const plan = [
      // Lun 11 publica para Mar 12
      { ejec: '2026-05-11T22:00', fvDay: 12, tasa: '500,46060000' },
      // Mar 12 publica para Mié 13
      { ejec: '2026-05-12T22:00', fvDay: 13, tasa: '504,91460000' },
      // Mié 13 publica para Jue 14
      { ejec: '2026-05-13T22:00', fvDay: 14, tasa: '510,78730000' },
      // Jue 14 publica para Vie 15
      { ejec: '2026-05-14T22:00', fvDay: 15, tasa: '515,18000000' },
      // Vie 15 publica para Lun 18 (salto de fin de semana)
      { ejec: '2026-05-15T22:00', fvDay: 18, tasa: '518,30000000' },
    ];

    for (const p of plan) {
      const r = await syncBcv(
        caracasInstant(p.ejec),
        fetcherDe({ year: 2026, month: 5, day: p.fvDay, tasa: p.tasa })
      );
      expect(r.chainOk).toBe(true);
      expect(r.warnings).toHaveLength(0);
      expect(r.nuevo).toBe(true);
    }

    // ── Verificaciones finales ──
    const all = await prisma.tasaBcvHistorico.findMany({
      orderBy: { fecha: 'asc' },
    });

    // 1. Cantidad
    expect(all).toHaveLength(5);

    // 2. Cadena: FV[i] === fecha[i+1]
    for (let i = 0; i < all.length - 1; i++) {
      expect(+all[i].fechaValor).toBe(+all[i + 1].fecha);
    }

    // 3. Unicidad columnar
    const fechas = all.map((r) => +r.fecha);
    const fvs = all.map((r) => +r.fechaValor);
    const tasas = all.map((r) => r.tasaUsdBs.toString());

    expect(new Set(fechas).size).toBe(5);
    expect(new Set(fvs).size).toBe(5);
    expect(new Set(tasas).size).toBe(5);

    // 4. Salto de fin de semana respetado (Vie 15 → Lun 18)
    const ultima = all[all.length - 1];
    expect(+ultima.fecha).toBe(+all[3].fechaValor); // ejec=Vie 15
    // No hay fila intermedia para sábado/domingo
    expect(all.filter((r) => [16, 17].includes(r.fecha.getUTCDate()))).toHaveLength(
      0
    );
  });
});
