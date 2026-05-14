import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { validarComprobanteOcr } from '@/lib/copa2026/ocr';
import { DateTime } from 'luxon';

const fv = (y: number, m: number, d: number) =>
  DateTime.fromObject({ year: y, month: m, day: d }, { zone: 'America/Caracas' })
          .startOf('day').toJSDate();

async function seed() {
  await prisma.tasaBcvHistorico.deleteMany({});
  await prisma.tasaBcvHistorico.createMany({
    data: [
      { fecha: fv(2026, 5, 8), fechaValor: fv(2026, 5, 8),  tasaUsdBs: 496.8301 },
      { fecha: fv(2026, 5, 11), fechaValor: fv(2026, 5, 11), tasaUsdBs: 499.8608 },
      { fecha: fv(2026, 5, 12), fechaValor: fv(2026, 5, 12), tasaUsdBs: 504.9146 },
      { fecha: fv(2026, 5, 13), fechaValor: fv(2026, 5, 13), tasaUsdBs: 508.6004 } // ← futura ya publicada
    ]
  });
}

// In order to test the OCR validation logic exactly like the user's specification 
// we will mock Tesseract so it returns whatever candidates we need.
import * as Tesseract from 'tesseract.js';
import { vi } from 'vitest';

vi.mock('tesseract.js', () => {
    return {
        default: {
            recognize: vi.fn()
        }
    }
});

describe('validarPago — selección de tasa por fecha', () => {
  beforeEach(seed);
  afterAll(async () => { await prisma.tasaBcvHistorico.deleteMany({}); });

  it('pago del 12/05 usa 504.9146 aunque la tasa del 13/05 ya esté cargada', async () => {
    const text = "Fecha: 12/05/2026 Monto: 5049.15 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text, confidence: 90 } });
    
    const r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);

    expect(r.isValid).toBe(true);
    expect(r.rawJson.tasaUsada).toBeCloseTo(504.9146, 4);
    expect(+r.rawJson.fechaValorTasa!).toBe(+fv(2026, 5, 12));
    expect(r.rawJson.montoEsperadoCalculado).toBeCloseTo(5049.146, 2);
  });

  it('pago del 13/05 usa 508.6004', async () => {
    const text = "Fecha: 13/05/2026 Monto: 5086.00 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text, confidence: 90 } });
    
    const r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.isValid).toBe(true);
    expect(r.rawJson.tasaUsada).toBeCloseTo(508.6004, 4);
  });

  it('pago del 09/05 (sábado) usa la tasa del 08/05 (último día hábil previo)', async () => {
    const text = "Fecha: 09/05/2026 Monto: 4968.30 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text, confidence: 90 } });
    
    const r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.isValid).toBe(true);
    expect(+r.rawJson.fechaValorTasa!).toBe(+fv(2026, 5, 8));
  });

  it('candidato menor al esperado menos margen → inválido', async () => {
    const text = "Fecha: 12/05/2026 Monto: 5040.00 Ref: nada"; // < 5049.146 - 5
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text, confidence: 90 } });
    
    const r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.isValid).toBe(false);
  });

  it('candidato dentro de margen 5 Bs → válido', async () => {
    const text = "Fecha: 12/05/2026 Monto: 5045.00 Ref: 1234"; // 5049.146 - 5 = 5044.146
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text, confidence: 90 } });
    
    const r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.isValid).toBe(true);
    expect(r.montoDetectado).toBe(5045.0);
  });

  it('elige el menor candidato que cumple el umbral', async () => {
    const text = "Fecha: 12/05/2026 Monto: 9999.00 Monto: 5050.00 Monto: 5100.00 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text, confidence: 90 } });
    
    const r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.montoDetectado).toBe(5050.0);
  });

  it('sin tasas en BD → isValid=false con motivo', async () => {
    await prisma.tasaBcvHistorico.deleteMany({});
    const text = "Fecha: 12/05/2026 Monto: 5049.15 Ref: 1234";
    (Tesseract.default.recognize as any).mockResolvedValueOnce({ data: { text, confidence: 90 } });
    
    const r = await validarComprobanteOcr('dummy', 10, '1234', 'A', 'B', 'V123', undefined);
    expect(r.isValid).toBe(false);
    expect(r.rawJson.error).toMatch(/Sin tasa/);
  });
});
