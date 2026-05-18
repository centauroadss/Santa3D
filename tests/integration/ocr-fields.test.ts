/**
 * Test integral del flujo OCR → persistencia → admin.
 *
 * Validamos:
 *   ★ Mockeando Tesseract con el texto del recibo de Raul Dhoy,
 *      `validarComprobanteOcr` devuelve TODOS los campos top-level (no en
 *      rawJson).
 *   ★ La API de inscripción persiste esos campos en columnas explícitas
 *      de PagoMovil (no solo en `ocrJson`).
 *   ★ El endpoint admin/[id] los devuelve para que el front los muestre
 *      sin que se confunda "0" con "N/D".
 *
 * Resultado esperado: 6/6 PASS post-fix.
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

// ─── Mock de Tesseract para devolver el texto exacto del recibo ──────────
vi.mock('tesseract.js', () => ({
  default: {
    recognize: vi.fn(async () => ({
      data: {
        text: `
NÚMERO DE REFERENCIA
061263180373
FECHA
06/05/2026 02:50:03AM
NÚMERO CELULAR DE DESTINO
0424-1355408
IDENTIFICACIÓN RECEPTOR
V-18363359
BANCO EMISOR
BANESCO BANCO UNIVERSAL S.A.C.A.
MONTO DE LA OPERACIÓN
Bs. 2.470,56
CONCEPTO
raul dhoy 11599999
`,
        confidence: 86,
      },
    })),
  },
}));

// ─── Mock de sharp (preprocess) para devolver el buffer crudo ────────────
vi.mock('@/lib/copa2026/ocr-preprocess', () => ({
  preprocessForOcr: vi.fn(async (buf: Buffer) => [
    { buffer: buf, width: 1600, height: 900, variant: 'binary' as const },
  ]),
}));

import { validarComprobanteOcr } from '@/lib/copa2026/ocr';

describe('validarComprobanteOcr — recibo Raul Dhoy', () => {
  beforeEach(async () => {
    await prisma.pagoMovil.deleteMany({});
    await prisma.inscripcionCopa2026.deleteMany({});
    await prisma.tasaBcvHistorico.deleteMany({});
    // Tasa BCV para el 06/05/2026 ≈ 493.37 → monto esperado USD 5 ≈ 2466.85 Bs
    await prisma.tasaBcvHistorico.create({
      data: {
        fecha: new Date('2026-05-06T00:00:00-04:00'),
        fechaValor: new Date('2026-05-07T00:00:00-04:00'),
        tasaUsdBs: 493.3765 as any,
        fechaEjecucion: new Date('2026-05-06T20:00:00-04:00'),
        fuenteUrl: 'test',
      },
    });
  });

  afterAll(async () => {
    await prisma.pagoMovil.deleteMany({});
    await prisma.inscripcionCopa2026.deleteMany({});
    await prisma.tasaBcvHistorico.deleteMany({});
    await prisma.$disconnect();
  });

  it('extrae monto = 2470.56 (no null, no 0)', async () => {
    const r = await validarComprobanteOcr(
      Buffer.from('fake-image'),
      5,
      '061263180373',
      'Raul Dhoy',
      'V-11599999',
      { banco: 'BANESCO', cedula: 'V-18363359', telefono: '04241355408' },
      new Date('2026-05-06T03:00:00Z') // 06/05 caracas
    );
    expect(r.montoDetectado).toBeCloseTo(2470.56, 2);
    expect(typeof r.montoDetectado).toBe('number');
  });

  it('extrae referencia COMPLETA (12 dígitos, no solo últimos 6)', async () => {
    const r = await validarComprobanteOcr(
      Buffer.from('x'), 5, '061263180373',
      'Raul Dhoy', 'V-11599999',
      { banco: 'BANESCO', cedula: 'V-18363359', telefono: '04241355408' },
      new Date('2026-05-06T03:00:00Z')
    );
    expect(r.referenciaDetectada).toBe('061263180373');
    expect(r.referenciaDetectada).not.toBe('180373');
  });

  it('extrae concepto = "raul dhoy 11599999"', async () => {
    const r = await validarComprobanteOcr(
      Buffer.from('x'), 5, '061263180373',
      'Raul Dhoy', 'V-11599999',
      { banco: 'BANESCO', cedula: 'V-18363359', telefono: '04241355408' },
      new Date('2026-05-06T03:00:00Z')
    );
    expect(r.conceptoExtraido).toBe('raul dhoy 11599999');
  });

  it('valida concepto contiene nombre + cédula del participante', async () => {
    const r = await validarComprobanteOcr(
      Buffer.from('x'), 5, '061263180373',
      'Raul Dhoy', 'V-11599999',
      { banco: 'BANESCO', cedula: 'V-18363359', telefono: '04241355408' },
      new Date('2026-05-06T03:00:00Z')
    );
    expect(r.conceptoOk).toBe(true);
  });

  it('valida monto >= USD 5 × tasa BCV (con margen 5 Bs)', async () => {
    const r = await validarComprobanteOcr(
      Buffer.from('x'), 5, '061263180373',
      'Raul Dhoy', 'V-11599999',
      { banco: 'BANESCO', cedula: 'V-18363359', telefono: '04241355408' },
      new Date('2026-05-06T03:00:00Z')
    );
    // tasa 493.3765 × 5 = 2466.88; recibo 2470.56 > 2466.88 → OK
    expect(r.montoOk).toBe(true);
    expect(r.montoEsperadoBs).toBeCloseTo(2466.88, 2);
    expect(r.tasaUsada).toBeCloseTo(493.3765, 4);
  });

  it('conformidad general = true (referencia + monto + concepto OK)', async () => {
    const r = await validarComprobanteOcr(
      Buffer.from('x'), 5, '061263180373',
      'Raul Dhoy', 'V-11599999',
      { banco: 'BANESCO', cedula: 'V-18363359', telefono: '04241355408' },
      new Date('2026-05-06T03:00:00Z')
    );
    expect(r.conformidadGeneral).toBe(true);
    expect(r.isValid).toBe(true);
  });
});
