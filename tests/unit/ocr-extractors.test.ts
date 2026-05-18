/**
 * Tests unitarios de los extractores OCR.
 *
 * Usa fixtures que reproducen el texto que Tesseract típicamente produce
 * para recibos de Banesco, Mercantil, Venezuela. Incluye variantes "sucias"
 * con confusiones OCR (O↔0, I↔1, etc.) para validar la tolerancia.
 *
 * Reproduce exactamente el recibo de Raul Dhoy del 06/05/2026:
 *   - Referencia: 061263180373
 *   - Monto: Bs. 2.470,56
 *   - Concepto: raul dhoy 11599999
 *
 * Resultado esperado: 22/22 PASS.
 */

import { describe, it, expect } from 'vitest';
import {
  extractReferencia,
  extractMonto,
  extractConcepto,
  extractFechaPago,
  extractCedulaReceptor,
  extractTelefonoDestino,
  extractBancoEmisor,
  extractAllFields,
  parseMontoVE,
} from '@/lib/copa2026/ocr-extractors';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const BANESCO_LIMPIO = `
Recibo
¡Operación Exitosa!
En breve le llegará un SMS con el resultado de la operación.
NÚMERO DE REFERENCIA
061263180373
FECHA
06/05/2026 02:50:03AM
NÚMERO CELULAR DE ORIGEN
04**-***7262
NÚMERO CELULAR DE DESTINO
0424-1355408
IDENTIFICACIÓN RECEPTOR
V-18363359
BANCO EMISOR
BANESCO BANCO UNIVERSAL S.A.C.A.
BANCO RECEPTOR
BANESCO BANCO UNIVERSAL S.A.C.A.
MONTO DE LA OPERACIÓN
Bs. 2.470,56
CONCEPTO
raul dhoy 11599999
Agregar a Pagos Frecuentes
Aceptar
`;

// Versión con OCR "sucio" — confusiones típicas
const BANESCO_OCR_SUCIO = `
Recibo
Operacion Exitosa
NUMERO DE REFERENCIA
O6I263I8O373
FECHA
O6/O5/2O26 O2:5O:O3AM
NUMERO CELULAR DE DESTINO
O424-1355408
IDENTIFICACION RECEPTOR
V-1836335g
BANCO EMISOR
BANESCO BANCO UNIVERSAL S.A.C.A.
MONTO DE LA OPERACION
8s. 2.47O,56
CONCEPTO
rauI dhoy II599999
`;

const MERCANTIL_LIMPIO = `
Mercantil Banco
TRANSFERENCIA EXITOSA
Referencia: 987654321012
Fecha: 15/05/2026
Monto: Bs. 5.151,80
Concepto: Maria Lopez V-87654321
Banco Emisor: MERCANTIL BANCO UNIVERSAL
`;

// ─── Referencia ─────────────────────────────────────────────────────────────

describe('extractReferencia', () => {
  it('captura referencia COMPLETA de recibo Banesco limpio', () => {
    expect(extractReferencia(BANESCO_LIMPIO)).toBe('061263180373');
  });

  it('captura referencia de OCR sucio (O→0, I→1)', () => {
    expect(extractReferencia(BANESCO_OCR_SUCIO)).toBe('061263180373');
  });

  it('captura referencia de Mercantil (etiqueta inline)', () => {
    expect(extractReferencia(MERCANTIL_LIMPIO)).toBe('987654321012');
  });

  it('devuelve null si no hay etiqueta ni dígitos suficientes', () => {
    expect(extractReferencia('Solo texto sin referencias')).toBeNull();
  });

  it('fallback: cualquier secuencia de 8+ dígitos', () => {
    expect(extractReferencia('Pago realizado 12345678 con éxito')).toBe('12345678');
  });
});

// ─── Monto ─────────────────────────────────────────────────────────────────

describe('parseMontoVE', () => {
  it('"2.470,56" → 2470.56', () => {
    expect(parseMontoVE('2.470,56')).toBeCloseTo(2470.56, 2);
  });
  it('"5.151,80" → 5151.8', () => {
    expect(parseMontoVE('5.151,80')).toBeCloseTo(5151.8, 2);
  });
  it('"2470,56" sin miles → 2470.56', () => {
    expect(parseMontoVE('2470,56')).toBeCloseTo(2470.56, 2);
  });
  it('"1.234.567,89" con doble separador → 1234567.89', () => {
    expect(parseMontoVE('1.234.567,89')).toBeCloseTo(1234567.89, 2);
  });
});

describe('extractMonto', () => {
  it('captura Bs 2.470,56 de Banesco', () => {
    expect(extractMonto(BANESCO_LIMPIO)).toBeCloseTo(2470.56, 2);
  });

  it('captura monto con OCR sucio (8s en vez de Bs)', () => {
    expect(extractMonto(BANESCO_OCR_SUCIO)).toBeCloseTo(2470.56, 2);
  });

  it('captura Bs 5.151,80 de Mercantil (etiqueta inline)', () => {
    expect(extractMonto(MERCANTIL_LIMPIO)).toBeCloseTo(5151.8, 2);
  });

  it('si no hay monto, devuelve null (NO 0)', () => {
    expect(extractMonto('Sin información de pago')).toBeNull();
  });
});

// ─── Concepto ─────────────────────────────────────────────────────────────

describe('extractConcepto', () => {
  it('captura "raul dhoy 11599999" de Banesco', () => {
    expect(extractConcepto(BANESCO_LIMPIO)).toBe('raul dhoy 11599999');
  });

  it('captura "Maria Lopez V-87654321" inline', () => {
    expect(extractConcepto(MERCANTIL_LIMPIO)).toBe('Maria Lopez V-87654321');
  });

  it('limpia basura típica al final ("Agregar a Pagos Frecuentes")', () => {
    const txt = `CONCEPTO\nJuan Perez V12345678\nAgregar a Pagos Frecuentes\nAceptar`;
    expect(extractConcepto(txt)).toBe('Juan Perez V12345678');
  });
});

// ─── Fecha ─────────────────────────────────────────────────────────────────

describe('extractFechaPago', () => {
  it('captura fecha de Banesco (06/05/2026)', () => {
    expect(extractFechaPago(BANESCO_LIMPIO)).toBe('2026-05-06');
  });
  it('captura fecha de Mercantil (15/05/2026)', () => {
    expect(extractFechaPago(MERCANTIL_LIMPIO)).toBe('2026-05-15');
  });
});

// ─── Cédula receptor + Banco + Teléfono ─────────────────────────────────

describe('extractCedulaReceptor / extractBancoEmisor / extractTelefonoDestino', () => {
  it('captura cédula receptor V-18363359', () => {
    expect(extractCedulaReceptor(BANESCO_LIMPIO)).toBe('V-18363359');
  });

  it('captura banco emisor Banesco con código 0134', () => {
    const b = extractBancoEmisor(BANESCO_LIMPIO);
    expect(b?.nombre).toBe('BANESCO');
    expect(b?.codigo).toBe('0134');
  });

  it('captura banco Mercantil con código 0105', () => {
    const b = extractBancoEmisor(MERCANTIL_LIMPIO);
    expect(b?.nombre).toBe('MERCANTIL');
    expect(b?.codigo).toBe('0105');
  });

  it('captura teléfono destino normalizado 04241355408', () => {
    expect(extractTelefonoDestino(BANESCO_LIMPIO)).toBe('04241355408');
  });
});

// ─── Punto de entrada combinado ───────────────────────────────────────────

describe('extractAllFields — escenario completo Banesco Raul Dhoy', () => {
  it('devuelve TODOS los campos del recibo del usuario en el reporte', () => {
    const fields = extractAllFields(BANESCO_LIMPIO);
    expect(fields).toEqual({
      referencia: '061263180373',
      monto: 2470.56,
      concepto: 'raul dhoy 11599999',
      fechaPago: '2026-05-06',
      cedulaReceptor: 'V-18363359',
      telefonoDestino: '04241355408',
      bancoEmisorNombre: 'BANESCO',
      bancoEmisorCodigo: '0134',
    });
  });

  it('aún con OCR sucio, recupera ≥ 5 de los 7 campos críticos', () => {
    const fields = extractAllFields(BANESCO_OCR_SUCIO);
    const presentes = Object.values(fields).filter((v) => v !== null).length;
    expect(presentes).toBeGreaterThanOrEqual(5);
    // Críticos: referencia, monto, concepto
    expect(fields.referencia).toBe('061263180373');
    expect(fields.monto).toBeCloseTo(2470.56, 2);
    expect(fields.concepto).toMatch(/dhoy/i);
  });
});
