import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/admin/bcv-historico/route';
import { DateTime } from 'luxon';

const fv = (y: number, m: number, d: number) =>
  DateTime.fromObject({ year: y, month: m, day: d }, { zone: 'America/Caracas' })
          .startOf('day').toJSDate();

describe('GET /api/admin/bcv-historico', () => {
  beforeEach(async () => {
    await prisma.tasaBcvHistorico.deleteMany({});
    // Fijamos "hoy" = 12/05/2026 Caracas
    vi.useFakeTimers();
    vi.setSystemTime(DateTime.fromObject(
      { year: 2026, month: 5, day: 12, hour: 10 },
      { zone: 'America/Caracas' }
    ).toJSDate());
    await prisma.tasaBcvHistorico.createMany({
      data: [
        { fecha: fv(2026, 5, 11), fechaValor: fv(2026, 5, 11), tasaUsdBs: 499.8608 },
        { fecha: fv(2026, 5, 12), fechaValor: fv(2026, 5, 12), tasaUsdBs: 504.9146 },
        { fecha: fv(2026, 5, 13), fechaValor: fv(2026, 5, 13), tasaUsdBs: 508.6004 }
      ]
    });
  });

  it('clasifica filas como histórica / vigente / futura', async () => {
    const res = await GET({} as any);
    const json = await res.json();
    const byFv = Object.fromEntries(
      json.data.map((f: any) => [new Date(f.fechaValor).toISOString().slice(0,10), f.estado])
    );
    expect(byFv['2026-05-11']).toBe('historica');
    expect(byFv['2026-05-12']).toBe('vigente');
    expect(byFv['2026-05-13']).toBe('futura');
  });

  it('calcula cat5 y cat10 con 2 decimales', async () => {
    const res = await GET({} as any);
    const json = await res.json();
    const vigente = json.data.find((f: any) => f.estado === 'vigente');
    expect(parseFloat(vigente.costoUnaCategoriaBs)).toBeCloseTo(504.9146 * 5, 2);
    expect(parseFloat(vigente.costoAmbasCategoriasBs)).toBeCloseTo(504.9146 * 10, 2);
  });
});
