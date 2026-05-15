import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncBcv } from '@/lib/copa2026/bcv-sync';

const HTML_12 = `USD 504,91460000  Fecha Valor: Martes, 12 Mayo 2026`;
const HTML_13 = `USD 508,60040000  Fecha Valor: Miércoles, 13 Mayo 2026`;

function mockFetch(html: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, status: 200, text: async () => html
  }));
}

describe('syncBcv', () => {
  beforeEach(async () => {
    await prisma.tasaBcvHistorico.deleteMany({});
    vi.restoreAllMocks();
  });
  afterAll(async () => { await prisma.tasaBcvHistorico.deleteMany({}); });

  it('primera corrida inserta nueva fila', async () => {
    mockFetch(HTML_12);
    const r = await syncBcv();
    expect(r.nuevo).toBe(true);
    expect(r.tasa).toBeCloseTo(504.9146, 4);
    const rows = await prisma.tasaBcvHistorico.findMany();
    expect(rows).toHaveLength(1);
  });

  it('corrida repetida con misma fecha valor NO duplica (UPSERT)', async () => {
    mockFetch(HTML_12);
    await syncBcv();
    await syncBcv();
    await syncBcv();
    const rows = await prisma.tasaBcvHistorico.findMany();
    expect(rows).toHaveLength(1);
  });

  it('cuando BCV publica fecha valor siguiente, agrega segunda fila', async () => {
    mockFetch(HTML_12);
    await syncBcv();
    mockFetch(HTML_13);
    const r = await syncBcv();
    expect(r.nuevo).toBe(true);

    const rows = await prisma.tasaBcvHistorico.findMany({
      orderBy: { fechaValor: 'asc' }
    });
    expect(rows).toHaveLength(2);
    expect(parseFloat(rows[1].tasaUsdBs.toString())).toBeCloseTo(508.6004, 4);
  });

  it('reemplaza tasa si BCV corrige el valor para la misma fecha valor', async () => {
    mockFetch(HTML_12);
    await syncBcv();
    mockFetch('USD 505,00000000  Fecha Valor: Martes, 12 Mayo 2026');
    await syncBcv();
    const rows = await prisma.tasaBcvHistorico.findMany();
    expect(rows).toHaveLength(1);
    expect(parseFloat(rows[0].tasaUsdBs.toString())).toBeCloseTo(505.0, 4);
  });

  it('falla con HTTP != 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(syncBcv()).rejects.toThrow(/503/);
  });
});
