import { describe, it, expect } from 'vitest';
import { validateAll } from '../../lib/copa2026/bcv-invariants';
import seedData from '../../prisma/seeds/bcv-historico.seed.json';

describe('Force Reset Protocol State', () => {
  it('contiene exactamente 14 filas canónicas', () => {
    expect(seedData).toHaveLength(14);
  });

  it('no rompe ninguna regla R1, R2, R3 (validación estricta de invariantes en seed)', () => {
    const mockRows = seedData.map((s, idx) => ({
      id: idx + 1,
      fecha: new Date(s.fecha + "T00:00:00.000-04:00"),
      fechaValor: new Date(s.fechaValor + "T00:00:00.000-04:00"),
      tasaUsdBs: s.tasaUsdBs,
    }));

    const errors = validateAll(mockRows);
    expect(errors).toHaveLength(0);
  });
  
  it('cubre el rango temporal completo de la falla', () => {
    expect(seedData[0].fecha).toBe('2026-04-24');
    expect(seedData[seedData.length - 1].fecha).toBe('2026-05-14');
  });

  it('el estado es completamente determinista y tiene valores consistentes', () => {
    for (const row of seedData) {
      expect(row.tasaUsdBs).toBeGreaterThan(480);
      expect(new Date(row.fecha).toString()).not.toBe('Invalid Date');
      expect(new Date(row.fechaValor).toString()).not.toBe('Invalid Date');
    }
  });
});
