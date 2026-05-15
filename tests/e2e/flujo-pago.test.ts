import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncBcv } from '@/lib/copa2026/bcv-sync';
import { validarComprobanteOcr } from '@/lib/copa2026/ocr';
import { DateTime } from 'luxon';

import * as Tesseract from 'tesseract.js';

vi.mock('tesseract.js', () => {
    return {
        default: {
            recognize: vi.fn()
        }
    }
});

const fv = (y: number, m: number, d: number) =>
  DateTime.fromObject({ year: y, month: m, day: d }, { zone: 'America/Caracas' })
          .startOf('day').toJSDate();

describe('E2E: BCV publica X+1, pagos de X siguen validándose con tasa de X', () => {
  beforeEach(async () => { await prisma.tasaBcvHistorico.deleteMany({}); });

  it('escenario completo del 12/05 → 13/05', async () => {
    // Lunes 8 PM Caracas: scraper lee tasa para martes 12/05
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, text: async () => 'USD 504,91460000 Fecha Valor: Martes, 12 Mayo 2026'
    }));
    await syncBcv();

    // Participante paga el martes 12/05 a las 14:00 Caracas
    const pagoMartes = "Fecha: 12/05/2026 Monto: 5049.15 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text: pagoMartes, confidence: 90 } });

    let r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.isValid).toBe(true);
    expect(r.rawJson.tasaUsada).toBeCloseTo(504.9146, 4);

    // Martes 5 PM Caracas: BCV publica tasa para miércoles 13/05
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, text: async () => 'USD 508,60040000 Fecha Valor: Miércoles, 13 Mayo 2026'
    }));
    await syncBcv();

    // Otro participante paga el martes 12/05 a las 22:00 — DESPUÉS de la publicación
    // pero antes de medianoche → DEBE seguir usando 504.9146
    const pagoTardeMartes = "Fecha: 12/05/2026 Monto: 5049.15 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text: pagoTardeMartes, confidence: 90 } });

    r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.rawJson.tasaUsada).toBeCloseTo(504.9146, 4);
    expect(+r.rawJson.fechaValorTasa!).toBe(+fv(2026, 5, 12));

    // Tercer participante paga el miércoles 13/05 a las 08:00 → ahora sí 508.6004
    const pagoMiercoles = "Fecha: 13/05/2026 Monto: 5086.00 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text: pagoMiercoles, confidence: 90 } });

    r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.rawJson.tasaUsada).toBeCloseTo(508.6004, 4);

    // Hay 2 filas en BD
    const rows = await prisma.tasaBcvHistorico.findMany();
    expect(rows).toHaveLength(2);
  });
});
