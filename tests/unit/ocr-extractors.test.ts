import { describe, it, expect } from 'vitest';
import { extractFechaPago } from '../../lib/copa2026/ocr-extractors';

const BANESCO_LIMPIO = `
¡Operación Exitosa!
NÚMERO DE REFERENCIA
061263180373
FECHA
06/05/2026 02:50:03AM
MONTO DE LA OPERACIÓN
Bs. 2.470,56
`;

describe('extractFechaPago', () => {
  it('captura "06/05/2026 02:50:03AM" del recibo Banesco real', () => {
    expect(extractFechaPago(BANESCO_LIMPIO)).toBe('2026-05-06T02:50:03-04:00');
  });

  it('M1: Múltiples labels', () => {
    expect(extractFechaPago('FECHA Y HORA\\n07/05/2026 10:00AM')).toBe('2026-05-07T10:00:00-04:00');
    expect(extractFechaPago('DATE\\n08/05/2026')).toBe('2026-05-08T12:00:00-04:00');
  });

  it('M2: Múltiples formatos', () => {
    expect(extractFechaPago('FECHA\\n06-05-2026')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\n06.05.2026')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\n2026-05-06')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\n06/05/26')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\n06 de mayo de 2026')).toBe('2026-05-06T12:00:00-04:00');
  });

  it('M3: Separadores OCR', () => {
    expect(extractFechaPago('FECHA\\n06l05l2026')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\n06I05I2026')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\n06|05|2026')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\n0610512026')).toBe('2026-05-06T12:00:00-04:00');
  });

  it('M4: Dígitos OCR', () => {
    expect(extractFechaPago('FECHA\\nO6/O5/2O26')).toBe('2026-05-06T12:00:00-04:00');
    expect(extractFechaPago('FECHA\\nQ6/05/2026')).toBe('2026-05-06T12:00:00-04:00');
  });

  it('M5: Plausibilidad', () => {
    expect(extractFechaPago('FECHA\\n31/02/2026')).toBe(null);
    expect(extractFechaPago('FECHA\\n32/05/2026')).toBe(null);
    expect(extractFechaPago('FECHA\\n06/13/2026')).toBe(null);
  });

  it('M6: Scoring por label', () => {
    expect(extractFechaPago('FECHA\\n06/05/2026\\nOtra fecha irrelevante 10/10/2026')).toBe('2026-05-06T12:00:00-04:00');
  });

  it('M7: Rango temporal', () => {
    expect(extractFechaPago('FECHA\\n06/05/1999')).toBe(null);
    expect(extractFechaPago('FECHA\\n06/05/2036')).toBe(null);
  });

  it('M8: Recorte de hora', () => {
    expect(extractFechaPago('FECHA\\n06/05/202602:50:03AM')).toBe('2026-05-06T02:50:03-04:00');
    expect(extractFechaPago('FECHA\\n06/05/202614:30:00')).toBe('2026-05-06T14:30:00-04:00');
  });

  it('M9: Fallback null', () => {
    expect(extractFechaPago('No hay ninguna fecha aquí')).toBe(null);
  });
});
